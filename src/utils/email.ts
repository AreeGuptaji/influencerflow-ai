import nodemailer, { Transporter } from "nodemailer";
import { env } from "@/env";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: nodemailer.Attachment[];
  replyTo?: string;
  headers?: Record<string, string>;
  messageId?: string;
}

// Create a reusable transporter object using SMTP transport
const createTransporter = async (): Promise<Transporter> => {
  // In development, use Ethereal for testing emails
  // In production, use real SMTP settings
  if (env.NODE_ENV === "development" && !env.EMAIL_HOST) {
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();

      // Create a testing transporter
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.error("Failed to create test account:", err);
      throw new Error("Failed to create email test account");
    }
  }

  // Create a production transporter with Gmail or other provider
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT) || 587,
    secure: env.EMAIL_SECURE === "true",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD,
    },
  });
};

interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: unknown;
}

// Send an email
export const sendEmail = async (
  options: EmailOptions,
): Promise<EmailResult> => {
  try {
    const transporter = await createTransporter();

    // Set default sender address
    const from = `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`;

    // Prepare email options
    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      replyTo: options.replyTo || env.EMAIL_REPLY_TO || from,
      headers: {
        ...options.headers,
        // Add X-Auto-Response-Suppress header to suppress automatic replies
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
      messageId: options.messageId,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Return the result
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};
