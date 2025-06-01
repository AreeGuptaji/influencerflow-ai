import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { MessageSender, MessageType } from "@prisma/client";

interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  headers: Record<string, string | string[]>;
}

/**
 * This webhook endpoint handles incoming email replies.
 * It can be connected to services like Mailgun, SendGrid, or custom setups.
 * The webhook should receive POST requests with email data in the body.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the webhook secret from the request header
    const providedSecret = req.headers.get("x-webhook-secret");

    // Verify webhook secret (make sure to set this in your environment variables)
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== providedSecret) {
      console.error("Invalid webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the email payload from the request body
    const payload = (await req.json()) as EmailPayload;

    // Validate the payload
    if (!payload?.messageId || !payload.from || !payload.subject) {
      console.error("Invalid payload format");
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 },
      );
    }

    // Check if this is a reply to an existing conversation by looking at the In-Reply-To header
    if (!payload.inReplyTo) {
      console.warn("Not a reply to an existing message");
      return NextResponse.json(
        { message: "Not a reply to an existing message" },
        { status: 200 },
      );
    }

    // Find the negotiation that contains the original message
    const originalMessage = await db.message.findFirst({
      where: {
        emailMetadata: {
          path: ["messageId"],
          equals: payload.inReplyTo,
        },
      },
      include: {
        negotiation: true,
      },
    });

    if (!originalMessage) {
      console.warn(
        `No matching message found for In-Reply-To: ${payload.inReplyTo}`,
      );
      return NextResponse.json(
        { message: "No matching message found" },
        { status: 200 },
      );
    }

    // Check if this is an auto-reply or out-of-office message
    if (isAutoReply(payload)) {
      console.log("Ignoring auto-reply message");
      return NextResponse.json(
        { message: "Auto-reply ignored" },
        { status: 200 },
      );
    }

    // Extract the negotiation ID
    const negotiationId = originalMessage.negotiationId;

    // Prepare email metadata
    const emailMetadata = {
      messageId: payload.messageId,
      inReplyTo: payload.inReplyTo,
      references: payload.references ?? [],
      headers: payload.headers,
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
    };

    // Store the reply in the database
    const message = await db.message.create({
      data: {
        negotiationId,
        sender: MessageSender.CREATOR, // Assuming replies come from creators
        content: payload.text ?? "",
        contentType: payload.html ? MessageType.EMAIL_HTML : MessageType.TEXT,
        emailMetadata,
        timestamp: new Date(),
      },
    });

    // Update the negotiation status if needed
    if (originalMessage.negotiation.status === "OUTREACH_SENT") {
      await db.negotiation.update({
        where: { id: negotiationId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json(
      {
        success: true,
        messageId: message.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Determines if an email is an auto-reply or out-of-office message
 */
function isAutoReply(payload: EmailPayload): boolean {
  // Check common auto-reply indicators in headers
  const headers = payload.headers;

  // Check Auto-Submitted header
  if (
    headers["auto-submitted"] &&
    headers["auto-submitted"] !== "no" &&
    headers["auto-submitted"] !== "false"
  ) {
    return true;
  }

  // Check X-Auto-Response-Suppress header
  if (headers["x-auto-response-suppress"]) {
    return true;
  }

  // Check for common auto-reply subject prefixes
  const subjectLower = payload.subject.toLowerCase();
  const autoReplyPrefixes = [
    "out of office",
    "automatic reply",
    "auto:",
    "auto-reply",
    "automatic response",
    "away from my mail",
  ];

  if (autoReplyPrefixes.some((prefix) => subjectLower.includes(prefix))) {
    return true;
  }

  // Check for empty return path which usually indicates a bounce
  if (headers["return-path"] === "<>") {
    return true;
  }

  return false;
}
