import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { CampaignStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const status = formData.get("status") as string;

    // Validate status
    if (
      !status ||
      !Object.values(CampaignStatus).includes(status as CampaignStatus)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update campaign status
    const campaign = await db.campaign.update({
      where: {
        id: params.id,
        brandId: session.user.id, // Ensure user owns the campaign
      },
      data: {
        status: status as CampaignStatus,
      },
    });

    // Redirect back to the campaign page
    return NextResponse.redirect(new URL(`/campaigns/${campaign.id}`, req.url));
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return NextResponse.json(
      { error: "Failed to update campaign status" },
      { status: 500 },
    );
  }
}
