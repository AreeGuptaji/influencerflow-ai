import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { AIMode } from "@prisma/client";
import { z } from "zod";

// Validation schema for AI mode update
const updateModeSchema = z.object({
  mode: z.nativeEnum(AIMode),
});

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
    const validationResult = updateModeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { mode } = validationResult.data;

    // Update the negotiation AI mode
    await db.negotiation.update({
      where: {
        id: negotiation.id,
      },
      data: {
        aiMode: mode,
      },
    });

    return NextResponse.json(
      { message: "AI mode updated successfully", mode },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating AI mode:", error);
    return NextResponse.json(
      { error: "Failed to update AI mode" },
      { status: 500 },
    );
  }
}
