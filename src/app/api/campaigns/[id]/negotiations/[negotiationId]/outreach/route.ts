import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { NegotiationStatus } from "@prisma/client";
import { sendOutreachEmail } from "@/server/services/negotiation.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; negotiationId: string } },
) {
  try {
    const session = await auth();
    const { id, negotiationId } = params;

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get negotiation to verify access
    const negotiation = await db.negotiation.findUnique({
      where: {
        id: negotiationId,
        campaignId: id,
        campaign: {
          brandId: session.user.id,
        },
      },
      include: {
        campaign: {
          select: {
            brandId: true,
          },
        },
      },
    });

    if (!negotiation || negotiation.campaign.brandId !== session.user.id) {
      return NextResponse.json(
        { error: "Negotiation not found or you don't have access" },
        { status: 404 },
      );
    }

    // Check if outreach is pending
    if (negotiation.status !== NegotiationStatus.PENDING_OUTREACH) {
      return NextResponse.json(
        {
          error: "Cannot initiate outreach",
          details: "Negotiation is not in PENDING_OUTREACH status",
        },
        { status: 400 },
      );
    }

    // Send the outreach email
    const result = await sendOutreachEmail(negotiationId);

    return NextResponse.json(
      {
        message: "Outreach initiated successfully",
        messageId: result.messageId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error initiating outreach:", error);
    return NextResponse.json(
      { error: "Failed to initiate outreach" },
      { status: 500 },
    );
  }
}
