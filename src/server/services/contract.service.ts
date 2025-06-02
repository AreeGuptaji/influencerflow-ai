import { db } from "@/server/db";
import { ContractStatus, MessageSender, MessageType } from "@prisma/client";
import { sendEmail } from "./email.service";

/**
 * Sends a contract to a creator via email and updates the contract status
 */
export async function sendContractEmail({
  contractId,
  includeMessage = true,
}: {
  contractId: string;
  includeMessage?: boolean;
}) {
  try {
    // Get the contract with related data
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        campaign: true,
        negotiation: {
          include: {
            terms: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error(`Contract not found with ID: ${contractId}`);
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new Error(`Contract must be in DRAFT status to be sent`);
    }

    if (!contract.negotiation) {
      throw new Error(`Contract has no associated negotiation`);
    }

    // Get creator email from the negotiation
    const creatorEmail = contract.negotiation.creatorEmail;

    // Extract creator name from email
    const creatorName = creatorEmail.split("@")[0];

    // Create contract link - in a real app, this would point to a secure contract viewing page
    const contractLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contracts/${contractId}/sign`;

    // Create email subject and content
    const subject = `Your Contract for ${contract.campaign.title}`;

    // Get terms or use fallbacks
    const terms = contract.negotiation.terms;

    // Helper function to safely access timeline properties
    const getTimelineProperty = (
      propertyName: string,
      defaultValue: string,
    ) => {
      if (!terms?.timeline) return defaultValue;

      try {
        // Handle string case (needs parsing)
        if (typeof terms.timeline === "string") {
          const parsed = JSON.parse(terms.timeline);
          return parsed[propertyName] || defaultValue;
        }

        // Handle object case with type guard
        if (
          terms.timeline &&
          typeof terms.timeline === "object" &&
          propertyName in terms.timeline
        ) {
          // Use type assertion since we confirmed the property exists
          return (
            ((terms.timeline as Record<string, unknown>)[
              propertyName
            ] as string) || defaultValue
          );
        }

        return defaultValue;
      } catch (e) {
        return defaultValue;
      }
    };

    const startDate = getTimelineProperty(
      "startDate",
      "As specified in contract",
    );
    const endDate = getTimelineProperty("endDate", "As specified in contract");

    const fee = terms?.fee ? `$${terms.fee}` : "As specified in contract";

    const textContent = `
Hello ${creatorName},

We're excited to move forward with our collaboration! Please review and sign the attached contract for the "${contract.campaign.title}" campaign.

You can view and sign the contract using this link:
${contractLink}

Contract Details:
- Campaign: ${contract.campaign.title}
- Start Date: ${startDate}
- End Date: ${endDate}
- Fee: ${fee}

Please review all terms carefully before signing. If you have any questions, feel free to reply to this email.

When signing the contract, you'll also be asked to provide your bank account details for payment processing once the campaign is completed.

Best regards,
The InfluenceFlow Team
    `;

    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hello ${creatorName},</p>
  
  <p>We're excited to move forward with our collaboration! Please review and sign the attached contract for the "${contract.campaign.title}" campaign.</p>
  
  <div style="margin: 25px 0; text-align: center;">
    <a href="${contractLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View & Sign Contract</a>
  </div>
  
  <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3 style="margin-top: 0;">Contract Details:</h3>
    <ul>
      <li><strong>Campaign:</strong> ${contract.campaign.title}</li>
      <li><strong>Start Date:</strong> ${startDate}</li>
      <li><strong>End Date:</strong> ${endDate}</li>
      <li><strong>Fee:</strong> ${fee}</li>
    </ul>
  </div>
  
  <p>Please review all terms carefully before signing. If you have any questions, feel free to reply to this email.</p>
  
  <p><strong>Note:</strong> When signing the contract, you'll also be asked to provide your bank account details for payment processing once the campaign is completed.</p>
  
  <p>Best regards,<br>The InfluenceFlow Team</p>
</div>
    `;

    // Send the email
    const { messageId } = await sendEmail({
      to: creatorEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    // Update contract status to SENT
    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.SENT,
      },
    });

    // If we should add a message to the negotiation
    if (includeMessage && contract.negotiation) {
      // Save the message in the database
      await db.message.create({
        data: {
          negotiationId: contract.negotiation.id,
          sender: MessageSender.BRAND_MANUAL,
          content: textContent,
          contentType: MessageType.EMAIL_HTML,
          emailMetadata: {
            messageId,
            subject,
          },
          timestamp: new Date(),
        },
      });
    }

    return {
      success: true,
      messageId,
      contractId: updatedContract.id,
    };
  } catch (error) {
    console.error("Error sending contract email:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send contract email",
    };
  }
}
