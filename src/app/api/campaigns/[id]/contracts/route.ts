import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view contracts" },
        { status: 401 },
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const negotiationId = url.searchParams.get("negotiationId");

    // Verify campaign ownership
    const campaign = await db.campaign.findUnique({
      where: {
        id: params.id,
        brandId: session.user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or you don't have permission to view it" },
        { status: 404 },
      );
    }

    // Get contracts for the campaign
    try {
      if (negotiationId) {
        // Get specific contract for a negotiation
        const contract = await db.contract.findUnique({
          where: {
            negotiationId: negotiationId,
            campaignId: params.id,
          },
        });

        if (!contract) {
          return NextResponse.json(
            { error: "Contract not found" },
            { status: 404 },
          );
        }

        return NextResponse.json({ contract });
      } else {
        // Get all contracts for the campaign
        const contracts = await db.contract.findMany({
          where: {
            campaignId: params.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return NextResponse.json({ contracts });
      }
    } catch (error) {
      // Handle case where contract model might not exist yet
      console.error("Error fetching contracts:", error);
      return NextResponse.json(
        { error: "Contract functionality not available" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in contracts API:", error);
    return NextResponse.json(
      { error: "Failed to retrieve contracts" },
      { status: 500 },
    );
  }
}
