import { db } from "@/server/db";
import {
  MessageSender,
  MessageType,
  NegotiationStatus,
  Prisma,
} from "@prisma/client";
import { sendEmail } from "./email.service";

/**
 * Type definition for EmailMetadata
 */
type EmailMetadata = {
  messageId: string;
  threadId?: string;
  subject?: string;
  from?: string;
  to?: string;
  inReplyTo?: string;
  references?: string[];
};

/**
 * Sends an email to a creator as part of a negotiation and records it in the database
 */
export async function sendNegotiationEmail({
  negotiationId,
  subject,
  textContent,
  htmlContent,
  sender = MessageSender.BRAND_AI,
  replyToMessageId,
}: {
  negotiationId: string;
  subject: string;
  textContent: string;
  htmlContent?: string;
  sender?: MessageSender;
  replyToMessageId?: string;
}) {
  try {
    // Get the negotiation details
    const negotiation = await db.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        messages: {
          where: {
            emailMetadata: {
              path: ["messageId"],
              not: Prisma.JsonNull,
            },
          },
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    if (!negotiation) {
      throw new Error(`Negotiation not found with ID: ${negotiationId}`);
    }

    // Determine if we need to use an existing email thread
    const lastMessage = negotiation.messages[0];
    const lastMessageMetadata = lastMessage?.emailMetadata as
      | EmailMetadata
      | undefined;
    const threadId =
      replyToMessageId ??
      lastMessageMetadata?.messageId ??
      negotiation.emailThreadId;

    // Send the email
    const { messageId } = await sendEmail({
      to: negotiation.creatorEmail,
      subject,
      text: textContent,
      html: htmlContent,
      threadId,
    });

    // Prepare email metadata
    const emailMetadata: EmailMetadata = {
      messageId,
      threadId: threadId ?? messageId,
      subject,
    };

    // Save the message in the database
    const message = await db.message.create({
      data: {
        negotiationId,
        sender,
        content: textContent,
        contentType: htmlContent ? MessageType.EMAIL_HTML : MessageType.TEXT,
        emailMetadata,
        timestamp: new Date(),
      },
    });

    // If this is the first message, update the negotiation with the thread ID
    if (!negotiation.emailThreadId) {
      await db.negotiation.update({
        where: { id: negotiationId },
        data: {
          emailThreadId: messageId,
          status: NegotiationStatus.OUTREACH_SENT,
        },
      });
    }

    return { message, messageId };
  } catch (error) {
    console.error("Error sending negotiation email:", error);
    throw error;
  }
}

/**
 * Sends the initial outreach email to a creator
 */
export async function sendOutreachEmail(negotiationId: string) {
  const negotiation = await db.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      campaign: true,
    },
  });

  if (!negotiation) {
    throw new Error(`Negotiation not found with ID: ${negotiationId}`);
  }

  // Extract creator details from parameters
  const creatorName = negotiation.creatorEmail.split("@")[0];
  const params = negotiation.parameters as Record<string, any>;

  // Create personalized outreach message
  const subject = `Collaboration opportunity: ${negotiation.campaign.title}`;
  const textContent = `
Hi ${creatorName},

We're reaching out because we love your content and believe you'd be a great fit for our campaign: "${negotiation.campaign.title}".

Campaign details:
- ${negotiation.campaign.description}
- Budget: $${negotiation.campaign.budget}
- Duration: ${new Date(negotiation.campaign.startDate).toLocaleDateString()} to ${new Date(negotiation.campaign.endDate).toLocaleDateString()}

We especially appreciate your content about ${(params.niches || []).join(", ")} and your engagement rate of ${params.engagementRate || ""}%.

Are you interested in collaborating with us? Let us know your thoughts by replying to this email.

Best regards,
InfluenceFlow AI
  `;

  // HTML version with basic formatting
  const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hi ${creatorName},</p>
  
  <p>We're reaching out because we love your content and believe you'd be a great fit for our campaign: <strong>"${negotiation.campaign.title}"</strong>.</p>
  
  <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3 style="margin-top: 0;">Campaign details:</h3>
    <ul>
      <li>${negotiation.campaign.description}</li>
      <li><strong>Budget:</strong> $${negotiation.campaign.budget}</li>
      <li><strong>Duration:</strong> ${new Date(negotiation.campaign.startDate).toLocaleDateString()} to ${new Date(negotiation.campaign.endDate).toLocaleDateString()}</li>
    </ul>
  </div>
  
  <p>We especially appreciate your content about <strong>${(params.niches || []).join(", ")}</strong> and your engagement rate of <strong>${params.engagementRate || ""}%</strong>.</p>
  
  <p>Are you interested in collaborating with us? Let us know your thoughts by replying to this email.</p>
  
  <p>Best regards,<br>InfluenceFlow AI</p>
</div>
  `;

  // Send the email
  return sendNegotiationEmail({
    negotiationId,
    subject,
    textContent,
    htmlContent,
    sender:
      negotiation.aiMode === "AUTONOMOUS"
        ? MessageSender.BRAND_AI
        : MessageSender.BRAND_MANUAL,
  });
}
