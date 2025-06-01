import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for parameters update
const updateParametersSchema = z.object({
  parameters: z.object({
    followerCount: z.string().optional(),
    engagementRate: z.string().optional(),
    niches: z.array(z.string()).optional(),
    location: z.string().optional(),
  }),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; negotiationId: string } },
) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get negotiation to verify access
    const negotiation = await db.negotiation.findUnique({
      where: {
        id: params.negotiationId,
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateParametersSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { parameters } = validationResult.data;

    // Merge new parameters with existing ones
    const updatedParameters = {
      ...negotiation.parameters,
      ...parameters,
    };

    // Update the negotiation parameters
    await db.negotiation.update({
      where: {
        id: negotiation.id,
      },
      data: {
        parameters: updatedParameters,
      },
    });

    return NextResponse.json(
      { message: "Parameters updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating parameters:", error);
    return NextResponse.json(
      { error: "Failed to update parameters" },
      { status: 500 },
    );
  }
}
