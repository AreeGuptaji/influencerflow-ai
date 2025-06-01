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
  creatorEmail: z.string().email(),
  parameters: z.object({
    followerCount: z.string().optional(),
    engagementRate: z.string().optional(),
    niches: z.array(z.string()).optional(),
    location: z.string().optional(),
  }),
  aiMode: z.nativeEnum(AIMode).default("AUTONOMOUS"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get campaign to verify ownership
    const campaign = await db.campaign.findUnique({
      where: {
        id: params.id,
        brandId: session.user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or you don't have access" },
        { status: 404 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
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

    const { creatorEmail, parameters, aiMode } = validationResult.data;

    // Check if a negotiation already exists for this creator email and campaign
    const existingNegotiation = await db.negotiation.findFirst({
      where: {
        campaignId: campaign.id,
        creatorEmail: creatorEmail,
      },
    });

    if (existingNegotiation) {
      return NextResponse.json(
        {
          message: "Negotiation already exists with this creator",
          negotiationId: existingNegotiation.id,
        },
        { status: 200 },
      );
    }

    // Create the negotiation
    const negotiation = await db.negotiation.create({
      data: {
        campaignId: campaign.id,
        creatorId: `creator-${Date.now()}`, // Generate a placeholder ID
        creatorEmail: creatorEmail,
        status: NegotiationStatus.PENDING_OUTREACH,
        channel: CommunicationChannel.EMAIL,
        aiMode: aiMode,
        parameters: parameters,
      },
    });

    // In a full implementation, you would trigger the initial outreach email here
    // For now, we'll just simulate that the outreach is pending

    return NextResponse.json(
      {
        message: "Negotiation created successfully",
        negotiationId: negotiation.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating negotiation:", error);
    return NextResponse.json(
      { error: "Failed to create negotiation" },
      { status: 500 },
    );
  }
}
