import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { NegotiationStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; negotiationId: string }> },
) {
  try {
    const session = await auth();
    const { id, negotiationId } = await params;

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get negotiation to verify access
    const negotiation = await db.negotiation.findUnique({
      where: {
        id: negotiationId,
      },
      include: {
        campaign: {
          select: {
            brandId: true,
          },
        },
        terms: true,
      },
    });

    if (!negotiation || negotiation.campaign.brandId !== session.user.id) {
      return NextResponse.json(
        { error: "Negotiation not found or you don't have access" },
        { status: 404 },
      );
    }

    // Check if terms exist
    if (!negotiation.terms) {
      return NextResponse.json(
        { error: "No terms exist for this negotiation" },
        { status: 400 },
      );
    }

    // Check if terms are already approved
    if (negotiation.terms.approvedAt) {
      return NextResponse.json(
        { error: "Terms are already approved" },
        { status: 400 },
      );
    }

    // Update the deal terms to set approvedAt
    await db.dealTerms.update({
      where: {
        id: negotiation.terms.id,
      },
      data: {
        approvedAt: new Date(),
      },
    });

    // Update negotiation status to AGREED
    await db.negotiation.update({
      where: {
        id: negotiation.id,
      },
      data: {
        status: NegotiationStatus.AGREED,
      },
    });

    // In a real implementation, you might want to:
    // 1. Send confirmation emails to both parties
    // 2. Generate a contract document
    // 3. Set up payment processing
    // 4. Create calendar events/reminders

    // Redirect back to the negotiation page with contract view
    return NextResponse.redirect(
      new URL(
        `/campaigns/${id}/negotiate/${negotiationId}?view=contract`,
        req.url,
      ),
    );
  } catch (error) {
    console.error("Error approving terms:", error);
    return NextResponse.json(
      { error: "Failed to approve terms" },
      { status: 500 },
    );
  }
}
