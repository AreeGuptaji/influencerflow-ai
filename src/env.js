import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Email configuration
    EMAIL_HOST: z.string().optional(),
    EMAIL_PORT: z.string().optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASSWORD: z.string().optional(),
    EMAIL_FROM_NAME: z.string().optional().default("InfluenceFlow AI"),
    EMAIL_FROM_ADDRESS: z
      .string()
      .optional()
      .default("noreply@influenceflow.ai"),
    EMAIL_REPLY_TO: z.string().optional(),
    EMAIL_SECURE: z.string().optional().default("false"),

    // Gmail OAuth2 configuration
    GMAIL_CLIENT_ID: z.string().optional(),
    GMAIL_CLIENT_SECRET: z.string().optional(),
    GMAIL_REFRESH_TOKEN: z.string().optional(),
    GMAIL_REDIRECT_URI: z
      .string()
      .optional()
      .default("https://developers.google.com/oauthplayground"),

    // Email webhook configuration
    EMAIL_WEBHOOK_SECRET: z.string().optional(),

    // Stripe Configuration
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_CONNECT_CLIENT_ID: z.string().optional(),
  },

  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    // Email environment variables
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    EMAIL_SECURE: process.env.EMAIL_SECURE,

    // Gmail OAuth2 environment variables
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI,

    // Email webhook secret
    EMAIL_WEBHOOK_SECRET: process.env.EMAIL_WEBHOOK_SECRET,

    // Stripe environment variables
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  emptyStringAsUndefined: true,
});
