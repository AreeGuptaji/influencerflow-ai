import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import stripe from "@/lib/stripe";

// Type definitions for deliverables
interface Deliverable {
  id: string;
  name: string;
  description: string;
  amount: number;
  completed: boolean;
  completedAt?: string | Date;
  paid: boolean;
  paidAt?: string | Date;
}

// Type for payment details
interface PaymentDetails {
  accountNumber: string;
  accountName?: string;
  bankName?: string;
  routingNumber?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const campaignId = params.id;
    const data = (await req.json()) as {
      contractId: string;
      deliverableIds: string[];
    };
    const { contractId, deliverableIds } = data;

    if (!contractId || !deliverableIds?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify the campaign belongs to the user
    const campaign = await db.campaign.findUnique({
      where: {
        id: campaignId,
        brandId: user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or not owned by you" },
        { status: 404 },
      );
    }

    // Verify the contract exists and is signed
    const contract = await db.contract.findUnique({
      where: {
        id: contractId,
        campaignId,
        signedByBrand: true,
        signedByCreator: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found or not fully signed" },
        { status: 404 },
      );
    }

    // Get the existing deliverables from the contract
    const deliverables =
      (contract.deliverables as unknown as Deliverable[]) || [];

    // Check if all deliverableIds exist in the contract
    const validDeliverableIds = deliverableIds.filter((id) =>
      deliverables.some((d) => d.id === id),
    );

    if (validDeliverableIds.length !== deliverableIds.length) {
      return NextResponse.json(
        { error: "One or more deliverable IDs are invalid" },
        { status: 400 },
      );
    }

    // Update the deliverables to mark them as completed
    const updatedDeliverables = deliverables.map((d) => ({
      ...d,
      completed: deliverableIds.includes(d.id) ? true : d.completed || false,
      completedAt: deliverableIds.includes(d.id) ? new Date() : d.completedAt,
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
      return NextResponse.json(
        { error: "No payment amount specified for these deliverables" },
        { status: 400 },
      );
    }

    // Find completed payment for this campaign
    const payment = await db.payment.findFirst({
      where: {
        campaignId,
        status: "COMPLETED",
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "No completed payment found for this campaign" },
        { status: 400 },
      );
    }

    // Get the creator's payment details from the contract
    const paymentDetails = contract.paymentDetails as unknown as PaymentDetails;

    if (!paymentDetails?.accountNumber) {
      return NextResponse.json(
        { error: "Creator payment details not found" },
        { status: 400 },
      );
    }

    try {
      // Simulated Stripe transfer
      console.log(
        `Transferring ${amountToPay} to creator ${contract.creatorId}`,
      );

      // Mark the deliverables as paid
      const finalDeliverables = updatedDeliverables.map((d) => ({
        ...d,
        paid: deliverableIds.includes(d.id) ? true : d.paid || false,
        paidAt: deliverableIds.includes(d.id) ? new Date() : d.paidAt,
      }));

      // Update the contract with the completed and paid deliverables
      await db.contract.update({
        where: { id: contractId },
        data: {
          deliverables: finalDeliverables as any,
        },
      });

      // Create a record of the payment to the creator
      await db.payment.create({
        data: {
          campaignId,
          contractId,
          creatorId: contract.creatorId,
          amount: amountToPay,
          type: "FINAL",
          status: "COMPLETED",
          description: `Payment for completed deliverables`,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Deliverables marked as completed and payment processed",
      });
    } catch (error) {
      console.error("Payment transfer error:", error);
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const campaignId = params.id;

    // Verify the campaign exists
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if user is brand or creator related to this campaign
    const isAuthorized =
      campaign.brandId === user.id ||
      !!(await db.contract.findFirst({
        where: {
          campaignId,
          creatorId: user.id,
        },
      }));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Not authorized to view this campaign" },
        { status: 403 },
      );
    }

    // Get all payments for this campaign
    const payments = await db.payment.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Error fetching payments" },
      { status: 500 },
    );
  }
}
