import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  // brandProcedure, // Assuming you might want a specific procedure for brands - we will use protectedProcedure and check role
} from "@/server/api/trpc";
import type { Context } from "@/server/api/trpc"; // Assuming Context is exported from trpc.ts
import { AIMode, NegotiationStatus, Prisma, UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Placeholder for email sending logic
// In a real app, this would use Nodemailer and your chosen email provider (SendGrid, Mailgun, etc.)
async function sendNegotiationEmail(input: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  // any other relevant email params like from, replyTo if configurable
}) {
  console.log("----- SENDING EMAIL -----");
  console.log("To:", input.to);
  console.log("Subject:", input.subject);
  console.log("HTML Body:", input.htmlBody.substring(0, 100) + "..."); // Log snippet
  console.log("----- EMAIL SENT (SIMULATED) -----");
  // Replace with actual email sending implementation
  return { success: true, messageId: `simulated-${Date.now()}` };
}

const initiateNegotiationInput = z.object({
  campaignId: z.string().cuid(),
  creatorEmail: z.string().email(),
  creatorId: z.string(), // Could be an internal ID or external identifier
  parameters: z.object({
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    deliverables: z.array(z.string()).optional(),
    timeline: z.string().optional(),
  }),
  initialMessage: z.object({
    subject: z.string(),
    body: z.string(),
  }),
});

const sendReplyInput = z.object({
  negotiationId: z.string().cuid(),
  subject: z.string(),
  body: z.string(),
});

const updateAIModeInput = z.object({
  negotiationId: z.string().cuid(),
  aiMode: z.nativeEnum(AIMode),
});

export const negotiationRouter = createTRPCRouter({
  initiateNegotiation: protectedProcedure
    .input(initiateNegotiationInput)
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: z.infer<typeof initiateNegotiationInput>;
      }) => {
        if (ctx.session!.user.role !== UserRole.BRAND) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only brands can initiate negotiations.",
          });
        }
        const {
          campaignId,
          creatorEmail,
          creatorId,
          parameters,
          initialMessage,
        } = input;

        const campaign = await ctx.db.campaign.findUnique({
          where: { id: campaignId, brandId: ctx.session!.user.id },
        });

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found or access denied.",
          });
        }

        const existingNegotiation = await ctx.db.negotiation.findFirst({
          where: {
            campaignId,
            creatorEmail,
            status: {
              in: [
                NegotiationStatus.PENDING_OUTREACH,
                NegotiationStatus.OUTREACH_SENT,
                NegotiationStatus.IN_PROGRESS,
                NegotiationStatus.TERMS_PROPOSED,
              ],
            },
          },
        });

        if (existingNegotiation) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An active negotiation with this creator for this campaign already exists.",
          });
        }

        const negotiation = await ctx.db.negotiation.create({
          data: {
            campaignId,
            creatorId,
            creatorEmail,
            parameters: parameters as Prisma.JsonObject,
            status: NegotiationStatus.PENDING_OUTREACH,
            aiMode: AIMode.AUTONOMOUS,
          },
        });

        const emailHtmlBody = `<p>${initialMessage.body.replace(/\n/g, "<br>")}</p><p><small>Ref: ${negotiation.id}</small></p>`;
        const emailTextBody = `${initialMessage.body}\n\nRef: ${negotiation.id}`;

        const emailSentResult = await sendNegotiationEmail({
          to: creatorEmail,
          subject: initialMessage.subject,
          htmlBody: emailHtmlBody,
          textBody: emailTextBody,
        });

        if (!emailSentResult.success) {
          await ctx.db.negotiation.update({
            where: { id: negotiation.id },
            data: { status: NegotiationStatus.FAILED },
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send initial outreach email.",
          });
        }

        await ctx.db.message.create({
          data: {
            negotiationId: negotiation.id,
            sender:
              negotiation.aiMode === AIMode.AUTONOMOUS
                ? "BRAND_AI"
                : "BRAND_MANUAL",
            content: initialMessage.body,
            contentType: "TEXT",
            emailMetadata: {
              subject: initialMessage.subject,
              to: creatorEmail,
              from: "platform@example.com",
              messageId: emailSentResult.messageId,
            } as Prisma.JsonObject,
          },
        });

        const updatedNegotiation = await ctx.db.negotiation.update({
          where: { id: negotiation.id },
          data: {
            status: NegotiationStatus.OUTREACH_SENT,
            emailThreadId: emailSentResult.messageId,
          },
        });

        return updatedNegotiation;
      },
    ),

  getNegotiationById: protectedProcedure
    .input(z.object({ negotiationId: z.string().cuid() }))
    .query(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { negotiationId: string };
      }) => {
        const negotiation = await ctx.db.negotiation.findUnique({
          where: { id: input.negotiationId },
          include: {
            messages: { orderBy: { timestamp: "asc" } },
            terms: true,
            campaign: { select: { title: true, brandId: true } },
          },
        });

        if (!negotiation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Negotiation not found.",
          });
        }

        if (
          negotiation.campaign.brandId !== ctx.session!.user.id &&
          ctx.session!.user.role !== UserRole.ADMIN
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this negotiation.",
          });
        }

        return negotiation;
      },
    ),

  listNegotiationsByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string().cuid() }))
    .query(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { campaignId: string };
      }) => {
        if (
          ctx.session!.user.role !== UserRole.BRAND &&
          ctx.session!.user.role !== UserRole.ADMIN
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
        }
        const negotiations = await ctx.db.negotiation.findMany({
          where: {
            campaignId: input.campaignId,
            // Ensure brand only sees their campaigns' negotiations if they are a brand user
            ...(ctx.session!.user.role === UserRole.BRAND && {
              campaign: { brandId: ctx.session!.user.id },
            }),
          },
          orderBy: { createdAt: "desc" },
          include: {
            campaign: { select: { title: true } },
          },
        });
        return negotiations;
      },
    ),

  sendReply: protectedProcedure
    .input(sendReplyInput)
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: z.infer<typeof sendReplyInput>;
      }) => {
        if (ctx.session!.user.role !== UserRole.BRAND) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only brands can send replies.",
          });
        }
        const { negotiationId, subject, body } = input;

        const negotiation = await ctx.db.negotiation.findUnique({
          where: {
            id: negotiationId,
            campaign: { brandId: ctx.session!.user.id },
          },
        });

        if (!negotiation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Negotiation not found or access denied.",
          });
        }

        if (
          negotiation.status === NegotiationStatus.AGREED ||
          negotiation.status === NegotiationStatus.DONE ||
          negotiation.status === NegotiationStatus.FAILED
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot send message, negotiation status is ${negotiation.status}.`,
          });
        }

        const emailHtmlBody = `<p>${body.replace(/\n/g, "<br>")}</p><p><small>Ref: ${negotiation.id}</small></p>`;
        const emailTextBody = `${body}\n\nRef: ${negotiation.id}`;

        const emailSentResult = await sendNegotiationEmail({
          to: negotiation.creatorEmail,
          subject: subject,
          htmlBody: emailHtmlBody,
          textBody: emailTextBody,
        });

        if (!emailSentResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send reply email.",
          });
        }

        await ctx.db.message.create({
          data: {
            negotiationId: negotiation.id,
            sender: "BRAND_MANUAL",
            content: body,
            contentType: "TEXT",
            emailMetadata: {
              subject: subject,
              to: negotiation.creatorEmail,
              from: "platform@example.com",
              messageId: emailSentResult.messageId,
              inReplyTo: negotiation.emailThreadId,
            } as Prisma.JsonObject,
          },
        });

        await ctx.db.negotiation.update({
          where: { id: negotiation.id },
          data: {
            status: NegotiationStatus.IN_PROGRESS,
            updatedAt: new Date(),
          },
        });

        return { success: true };
      },
    ),

  updateNegotiationAIMode: protectedProcedure
    .input(updateAIModeInput)
    .mutation(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: z.infer<typeof updateAIModeInput>;
      }) => {
        if (ctx.session!.user.role !== UserRole.BRAND) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only brands can update AI mode.",
          });
        }
        const negotiation = await ctx.db.negotiation.findUnique({
          where: {
            id: input.negotiationId,
            campaign: { brandId: ctx.session!.user.id },
          },
        });

        if (!negotiation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Negotiation not found or access denied.",
          });
        }

        return ctx.db.negotiation.update({
          where: { id: input.negotiationId },
          data: { aiMode: input.aiMode },
        });
      },
    ),

  getNegotiationByCreatorId: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        creatorId: z.string(),
      }),
    )
    .query(
      async ({
        ctx,
        input,
      }: {
        ctx: Context;
        input: { campaignId: string; creatorId: string };
      }) => {
        if (
          ctx.session!.user.role !== UserRole.BRAND &&
          ctx.session!.user.role !== UserRole.ADMIN
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied.",
          });
        }

        const negotiation = await ctx.db.negotiation.findFirst({
          where: {
            campaignId: input.campaignId,
            creatorId: input.creatorId,
            // If user is a brand, ensure they only see their own campaigns
            ...(ctx.session!.user.role === UserRole.BRAND && {
              campaign: { brandId: ctx.session!.user.id },
            }),
          },
          include: {
            messages: { orderBy: { timestamp: "asc" } },
            terms: true,
            campaign: { select: { title: true, brandId: true } },
          },
        });

        if (!negotiation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Negotiation not found.",
          });
        }

        return negotiation;
      },
    ),
});
