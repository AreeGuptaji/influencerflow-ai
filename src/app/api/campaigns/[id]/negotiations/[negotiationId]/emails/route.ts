import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { MessageSender } from "@prisma/client";
import { sendNegotiationEmail } from "@/utils/negotiation-email";

// Define the type for the email request body
interface EmailRequestBody {
  subject: string;
  text: string;
  html?: string;
  replyToMessageId?: string;
}

/**
 * API endpoint for sending emails in a negotiation context
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; negotiationId: string }> },
) {
  try {
    const session = await auth();
    const { id: campaignId, negotiationId } = await params;

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the negotiation to verify permissions
    const negotiation = await db.negotiation.findUnique({
      where: {
        id: negotiationId,
        campaignId,
      },
      include: {
        campaign: {
          select: {
            brandId: true,
            title: true,
          },
        },
      },
    });

    if (!negotiation) {
      return NextResponse.json(
        { error: "Negotiation not found" },
        { status: 404 },
      );
    }

    // Verify that the user has access to this negotiation
    if (negotiation.campaign.brandId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse the request body
    const body = (await req.json()) as EmailRequestBody;
    const { subject, text, html, replyToMessageId } = body;

    // Validate the required fields
    if (!subject || !text) {
      return NextResponse.json(
        { error: "Subject and text are required" },
        { status: 400 },
      );
    }

    // Send the email
    const result = await sendNegotiationEmail({
      negotiationId,
      subject,
      text,
      html,
      replyToMessageId,
      sender: MessageSender.BRAND_MANUAL, // Emails sent through this endpoint are always from the brand
    });

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      console.error("Failed to send email:", result.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
