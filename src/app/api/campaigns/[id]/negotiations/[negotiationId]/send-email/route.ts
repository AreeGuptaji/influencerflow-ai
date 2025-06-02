import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { MessageSender, MessageType } from "@prisma/client";
import { z } from "zod";
import { sendNegotiationEmail } from "@/server/services/negotiation.service";

// Validation schema for email sending
const sendEmailSchema = z.object({
  subject: z.string().min(1).max(255),
  message: z.string().min(1),
  html: z.string().optional(),
  sender: z.nativeEnum(MessageSender).default(MessageSender.BRAND_MANUAL),
  replyToMessageId: z.string().optional(),
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = sendEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { subject, message, html, sender, replyToMessageId } =
      validationResult.data;

    // Send the email
    const result = await sendNegotiationEmail({
      negotiationId,
      subject,
      textContent: message,
      htmlContent: html,
      sender,
      replyToMessageId,
    });

    // If this is the first message, update the negotiation status
    if (negotiation.status === "PENDING_OUTREACH") {
      await db.negotiation.update({
        where: {
          id: negotiationId,
        },
        data: {
          status: "OUTREACH_SENT",
        },
      });
    }

    return NextResponse.json(
      {
        message: "Email sent successfully",
        messageId: result.messageId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
