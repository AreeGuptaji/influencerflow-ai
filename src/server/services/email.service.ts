import nodemailer from "nodemailer";
import { google } from "googleapis";
import { env } from "@/env";

// Configure OAuth2 client - only if credentials are provided
const getOAuth2Client = () => {
  if (
    !env.GMAIL_CLIENT_ID ||
    !env.GMAIL_CLIENT_SECRET ||
    !env.GMAIL_REDIRECT_URI
  ) {
    return null;
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      env.GMAIL_CLIENT_ID,
      env.GMAIL_CLIENT_SECRET,
      env.GMAIL_REDIRECT_URI,
    );

    if (env.GMAIL_REFRESH_TOKEN) {
      oAuth2Client.setCredentials({
        refresh_token: env.GMAIL_REFRESH_TOKEN,
      });
    }

    return oAuth2Client;
  } catch (error) {
    console.error("Error configuring OAuth2 client:", error);
    return null;
  }
};

/**
 * Creates and returns a configured Nodemailer transporter
 * using Gmail OAuth2 authentication if credentials are available
 * Falls back to regular SMTP if OAuth is not configured
 */
export async function createTransporter() {
  try {
    const oAuth2Client = getOAuth2Client();

    // If OAuth is configured, use it
    if (oAuth2Client && env.GMAIL_REFRESH_TOKEN) {
      try {
        const accessToken = await oAuth2Client.getAccessToken();

        // Create the transporter with OAuth2
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: env.EMAIL_FROM_ADDRESS,
            clientId: env.GMAIL_CLIENT_ID,
            clientSecret: env.GMAIL_CLIENT_SECRET,
            refreshToken: env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken?.token ?? "",
          },
        });

        // Verify connection configuration
        await transporter.verify();
        console.log("Email service ready using Gmail OAuth2");

        return transporter;
      } catch (error) {
        console.error(
          "Error creating OAuth2 transporter, falling back to SMTP:",
          error,
        );
        // Fall back to regular SMTP
      }
    }

    // Use regular SMTP if OAuth is not configured or failed
    if (env.EMAIL_HOST) {
      const transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: Number(env.EMAIL_PORT) || 587,
        secure: env.EMAIL_SECURE === "true",
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      });

      await transporter.verify();
      console.log("Email service ready using SMTP");

      return transporter;
    }

    // If we get here, neither OAuth nor SMTP is configured
    console.warn("No email configuration found. Emails will not be sent.");

    // Create a mock transporter that logs instead of sending
    if (env.NODE_ENV === "development") {
      return {
        sendMail: (mailOptions: any) => {
          console.log("MOCK EMAIL SENT:", mailOptions);
          return Promise.resolve({
            messageId: `mock-${Date.now()}@example.com`,
          });
        },
        verify: () => Promise.resolve(true),
      };
    }

    throw new Error("Email service not configured");
  } catch (error) {
    console.error("Error creating email transporter:", error);
    throw error;
  }
}

/**
 * Send an email using the configured transporter
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
  threadId,
}: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: any[];
  threadId?: string;
}) {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `InfluenceFlow <${env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
      replyTo,
      attachments,
      headers: threadId
        ? {
            References: threadId,
            "In-Reply-To": threadId,
          }
        : undefined,
    };

    const info = await transporter.sendMail(mailOptions);

    // Return the message ID and thread ID for tracking
    return {
      messageId: info.messageId,
      threadId: info.messageId, // Gmail uses the first message ID as thread ID
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
