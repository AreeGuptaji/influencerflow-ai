import { sendEmail } from "./email";
import { db } from "@/server/db";
import { MessageSender, MessageType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import type { Attachment } from "nodemailer/lib/mailer";

interface NegotiationEmailOptions {
  negotiationId: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Attachment[];
  replyToMessageId?: string; // If this is a reply to a specific message
  sender: MessageSender;
}

/**
 * Sends an email in the context of a negotiation and records it in the database
 */
export async function sendNegotiationEmail(options: NegotiationEmailOptions) {
  try {
    // Get the negotiation details
    const negotiation = await db.negotiation.findUnique({
      where: { id: options.negotiationId },
      include: {
        campaign: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new Error(`Negotiation not found: ${options.negotiationId}`);
    }

    // Generate a unique message ID for this email
    const messageId = `<${uuidv4()}@influenceflow.ai>`;

    // Determine sender and recipient
    let from, to;
    if (options.sender === MessageSender.CREATOR) {
      // If sender is creator, send from creator to brand
      from = negotiation.creatorEmail;
      to = negotiation.campaign.brand.email ?? "";
    } else {
      // If sender is brand (AI or manual), send from brand to creator
      from = negotiation.campaign.brand.email ?? "";
      to = negotiation.creatorEmail;
    }

    // Prepare references for email threading
    const references: string[] = [];

    // If this is a reply, include the original message ID in the references
    if (options.replyToMessageId) {
      references.push(options.replyToMessageId);

      // Also find any other message IDs in the thread to maintain the conversation
      const previousMessages = await db.message.findMany({
        where: { negotiationId: options.negotiationId },
        select: { emailMetadata: true },
        orderBy: { timestamp: "asc" },
      });

      // Add all previous message IDs to references for proper threading
      for (const msg of previousMessages) {
        const metadata = msg.emailMetadata as Record<string, unknown> | null;
        if (
          metadata?.messageId &&
          typeof metadata.messageId === "string" &&
          !references.includes(metadata.messageId)
        ) {
          references.push(metadata.messageId);
        }
      }
    }

    // Set email headers for proper threading
    const headers: Record<string, string> = {
      "X-Negotiation-ID": options.negotiationId,
      "X-Campaign-ID": negotiation.campaignId,
    };

    // If this is a reply, add the In-Reply-To header
    if (options.replyToMessageId) {
      headers["In-Reply-To"] = options.replyToMessageId;
    }

    // If we have references, add them to headers
    if (references.length > 0) {
      headers.References = references.join(" ");
    }

    // Send the email
    const emailResult = await sendEmail({
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      headers,
      messageId,
      replyTo: from,
    });

    // Record the message in our database
    if (emailResult.success) {
      // Prepare email metadata for storage
      const emailMetadata = {
        messageId,
        inReplyTo: options.replyToMessageId,
        references,
        from,
        to,
        subject: options.subject,
      };

      // Create message record
      const message = await db.message.create({
        data: {
          negotiationId: options.negotiationId,
          sender: options.sender,
          content: options.text,
          contentType: options.html ? MessageType.EMAIL_HTML : MessageType.TEXT,
          emailMetadata,
          timestamp: new Date(),
        },
      });

      // Update negotiation status if needed (e.g., from PENDING_OUTREACH to OUTREACH_SENT)
      if (negotiation.status === "PENDING_OUTREACH") {
        await db.negotiation.update({
          where: { id: options.negotiationId },
          data: { status: "OUTREACH_SENT" },
        });
      }

      return {
        success: true,
        messageId: message.id,
        emailMessageId: messageId,
      };
    } else {
      throw new Error(
        `Failed to send email: ${JSON.stringify(emailResult.error)}`,
      );
    }
  } catch (error) {
    console.error("Error in sendNegotiationEmail:", error);
    return { success: false, error };
  }
}
