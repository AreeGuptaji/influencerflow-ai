import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import {
  AIMode,
  CommunicationChannel,
  NegotiationStatus,
} from "@prisma/client";
import { z } from "zod";

// Validation schema for negotiation creation
const createNegotiationSchema = z.object({
  creatorId: z.string().min(1, "Creator ID is required"),
  creatorEmail: z.string().email("Valid email is required"),
  parameters: z.object({
    followerCount: z.string().optional(),
    engagementRate: z.string().optional(),
    niches: z.array(z.string()).optional(),
    location: z.string().optional(),
  }),
  aiMode: z.nativeEnum(AIMode).default("AUTONOMOUS"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id: campaignId } = await params;

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if campaign exists and belongs to the user
    const campaign = await db.campaign.findUnique({
      where: {
        id: campaignId,
        brandId: session.user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        {
          error: "Campaign not found or you don't have permission to modify it",
        },
        { status: 404 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate the request body using Zod schema
    const validationResult = createNegotiationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { creatorId, creatorEmail, parameters, aiMode } =
      validationResult.data;

    // Check if negotiation already exists for this campaign and creator
    const existingNegotiation = await db.negotiation.findFirst({
      where: {
        campaignId,
        creatorId,
      },
    });

    if (existingNegotiation) {
      return NextResponse.json(
        {
          error: "A negotiation with this creator already exists",
          negotiationId: existingNegotiation.id,
        },
        { status: 409 },
      );
    }

    // Create a new negotiation
    const negotiation = await db.negotiation.create({
      data: {
        campaignId,
        creatorId,
        creatorEmail,
        status: NegotiationStatus.PENDING_OUTREACH,
        aiMode,
        parameters: parameters || {},
      },
    });

    return NextResponse.json({
      message: "Creator added to campaign",
      negotiationId: negotiation.id,
      creatorId: negotiation.creatorId,
    });
  } catch (error) {
    console.error("Error adding creator to campaign:", error);
    return NextResponse.json(
      { error: "Failed to add creator to campaign" },
      { status: 500 },
    );
  }
}
