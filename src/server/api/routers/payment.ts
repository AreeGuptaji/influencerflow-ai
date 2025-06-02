import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  UserRole,
  PaymentType,
  PaymentStatus,
  type Contract,
  type Payment,
} from "@prisma/client";
import stripe from "@/lib/stripe";
import { TRPCError } from "@trpc/server";

// Define types for the JSON fields
interface Deliverable {
  id: string;
  name: string;
  description: string;
  amount: number;
  completed: boolean;
  paid: boolean;
  completedAt?: string | null;
  paidAt?: string | null;
}

interface PaymentDetails {
  accountNumber: string;
  routingNumber?: string;
  accountType?: string;
  bankName?: string;
  [key: string]: unknown;
}

// Type for contracts with negotiation data
type ContractWithCreator = {
  id: string;
  campaignId: string;
  creatorId: string;
  negotiationId?: string | null;
  status: string;
  content: string;
  version: number;
  signedByBrand: boolean;
  signedByCreator: boolean;
  brandSignedAt?: Date | null;
  creatorSignedAt?: Date | null;
  pdfUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  paymentDetails?: Record<string, unknown> | null;
  deliverables: Deliverable[];
  negotiation?: {
    creatorEmail: string;
  } | null;
  creatorName?: string | null;
};

export const paymentRouter = createTRPCRouter({
  // Get payments for a campaign
  getCampaignPayments: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { campaignId } = input;
      const userId = ctx.session.user.id;

      // First verify that the user has access to this campaign
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user is brand or creator related to this campaign
      const isCreator = await ctx.db.contract.findFirst({
        where: {
          campaignId,
          creatorId: userId,
        },
      });

      const isAuthorized = campaign.brandId === userId || !!isCreator;

      if (!isAuthorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this campaign's payments",
        });
      }

      // Get all payments for this campaign
      const payments = await ctx.db.payment.findMany({
        where: { campaignId },
        orderBy: { createdAt: "desc" },
        include: {
          contract: {
            select: {
              creatorId: true,
            },
          },
        },
      });

      return payments;
    }),

  // Get contracts for a campaign
  getCampaignContracts: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { campaignId } = input;
      const userId = ctx.session.user.id;

      // First verify that the user has access to this campaign
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user is the brand owner of this campaign
      if (campaign.brandId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this campaign's contracts",
        });
      }

      // Get all contracts for this campaign with creator info
      const contracts = await ctx.db.contract.findMany({
        where: {
          campaignId,
          signedByBrand: true,
          signedByCreator: true,
        },
        include: {
          negotiation: {
            select: {
              creatorEmail: true,
            },
          },
        },
      });

      // Format contracts to include deliverables properly typed
      return contracts.map((contract) => {
        // Parse JSON fields with proper typing
        const deliverables = contract.deliverables
          ? (contract.deliverables as unknown as Deliverable[])
          : [];

        const creatorName =
          contract.negotiation?.creatorEmail.split("@")[0] ?? null;

        return {
          ...contract,
          deliverables,
          creatorName,
        } as ContractWithCreator;
      });
    }),

  // Process payment for completed deliverables
  processPayment: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        contractId: z.string(),
        deliverableIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, contractId, deliverableIds } = input;
      const userId = ctx.session.user.id;

      // Verify the campaign belongs to the user
      const campaign = await ctx.db.campaign.findUnique({
        where: {
          id: campaignId,
          brandId: userId,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found or not owned by you",
        });
      }

      // Verify the contract exists and is signed
      const contract = await ctx.db.contract.findUnique({
        where: {
          id: contractId,
          campaignId,
          signedByBrand: true,
          signedByCreator: true,
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found or not fully signed",
        });
      }

      // Get the existing deliverables from the contract with proper typing
      const deliverables =
        (contract.deliverables as unknown as Deliverable[]) || [];

      // Check if all deliverableIds exist in the contract
      const validDeliverableIds = deliverableIds.filter((id) =>
        deliverables.some((d) => d.id === id),
      );

      if (validDeliverableIds.length !== deliverableIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more deliverable IDs are invalid",
        });
      }

      // Update the deliverables to mark them as completed
      const updatedDeliverables = deliverables.map((d) => ({
        ...d,
        completed: deliverableIds.includes(d.id)
          ? true
          : (d.completed ?? false),
        completedAt: deliverableIds.includes(d.id)
          ? new Date().toISOString()
          : d.completedAt,
      }));

      // Calculate total amount to be paid for the completed deliverables
      const completedDeliverablesToPay = updatedDeliverables.filter(
        (d) => deliverableIds.includes(d.id) && !d.paid,
      );

      const amountToPay = completedDeliverablesToPay.reduce(
        (sum, d) => sum + (d.amount ?? 0),
        0,
      );

      if (amountToPay <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No payment amount specified for these deliverables",
        });
      }

      // Find completed payment for this campaign
      const payment = await ctx.db.payment.findFirst({
        where: {
          campaignId,
          status: "COMPLETED",
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No completed payment found for this campaign",
        });
      }

      // Get the creator's payment details from the contract
      const paymentDetails =
        (contract.paymentDetails as unknown as PaymentDetails) || null;

      if (!paymentDetails?.accountNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Creator payment details not found",
        });
      }

      try {
        // Mark the deliverables as paid
        const finalDeliverables = updatedDeliverables.map((d) => ({
          ...d,
          paid: deliverableIds.includes(d.id) ? true : (d.paid ?? false),
          paidAt: deliverableIds.includes(d.id)
            ? new Date().toISOString()
            : d.paidAt,
        }));

        // Update the contract with the completed and paid deliverables
        await ctx.db.contract.update({
          where: { id: contractId },
          data: {
            deliverables: finalDeliverables as any,
          },
        });

        // Create a record of the payment to the creator
        const creatorPayment = await ctx.db.payment.create({
          data: {
            campaignId,
            contractId,
            creatorId: contract.creatorId,
            amount: amountToPay,
            type: PaymentType.FINAL,
            status: PaymentStatus.COMPLETED,
            description: `Payment for completed deliverables`,
            completedAt: new Date(),
          },
        });

        return {
          success: true,
          payment: creatorPayment,
          message: "Deliverables marked as completed and payment processed",
        };
      } catch (error) {
        console.error("Payment processing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process payment",
        });
      }
    }),

  // Initiate payment for a campaign (brand funding the campaign)
  initiatePayment: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        amount: z.number().int().positive(),
        description: z.string().optional(),
        returnUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, amount, description, returnUrl } = input;
      const userId = ctx.session.user.id;

      // Verify user is a brand
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { brandProfile: true },
      });

      if (!user || user.role !== UserRole.BRAND) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only brands can initiate payments",
        });
      }

      // Check if campaign exists and belongs to brand
      const campaign = await ctx.db.campaign.findUnique({
        where: {
          id: campaignId,
          brandId: userId,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found or not owned by brand",
        });
      }

      // Create a payment record in the database
      const payment = await ctx.db.payment.create({
        data: {
          campaignId,
          creatorId: "placeholder", // Will be filled later when contract is signed
          amount,
          type: PaymentType.DEPOSIT,
          status: PaymentStatus.PENDING,
          description: description ?? `Payment for campaign: ${campaign.title}`,
        },
      });

      // Create a Stripe checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Payment for campaign: ${campaign.title}`,
                description: description ?? "Campaign funds deposit",
              },
              unit_amount: amount, // Amount in cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          paymentId: payment.id,
          campaignId,
          userId,
        },
        mode: "payment",
        success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?canceled=true`,
      });

      // Update payment with Stripe session ID
      await ctx.db.payment.update({
        where: { id: payment.id },
        data: { stripeSessionId: checkoutSession.id },
      });

      return { url: checkoutSession.url };
    }),
});
