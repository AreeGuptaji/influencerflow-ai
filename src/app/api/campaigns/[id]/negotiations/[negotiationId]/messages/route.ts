import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { MessageSender, MessageType, Prisma } from "@prisma/client";
import { z } from "zod";

// Validation schema for message creation
const createMessageSchema = z.object({
  content: z.string().min(1),
  sender: z.nativeEnum(MessageSender),
  contentType: z.nativeEnum(MessageType).default("TEXT"),
  emailMetadata: z.record(z.unknown()).optional(),
});

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
    const validationResult = createMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { content, sender, contentType, emailMetadata } =
      validationResult.data;

    // Validate that brand can only send messages as BRAND_MANUAL or BRAND_AI
    if (
      sender === "CREATOR" &&
      negotiation.campaign.brandId === session.user.id
    ) {
      return NextResponse.json(
        { error: "Brand cannot send messages as creator" },
        { status: 400 },
      );
    }

    // Create the message
    const message = await db.message.create({
      data: {
        negotiationId: negotiation.id,
        sender,
        content,
        contentType,
        emailMetadata: (emailMetadata as Prisma.JsonObject) || undefined,
        timestamp: new Date(),
      },
    });

    // Update negotiation status if it's the first message
    if (negotiation.status === "PENDING_OUTREACH") {
      await db.negotiation.update({
        where: {
          id: negotiation.id,
        },
        data: {
          status: "OUTREACH_SENT",
        },
      });
    }

    // In a real implementation, we would trigger email sending here for brand messages
    // and potentially process the message with AI for generating responses

    return NextResponse.json(
      { message: "Message sent successfully", messageId: message.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

export async function GET(
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
        messages: {
          orderBy: {
            timestamp: "asc",
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

    return NextResponse.json(
      { messages: negotiation.messages },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return NextResponse.json(
      { error: "Failed to retrieve messages" },
      { status: 500 },
    );
  }
}
