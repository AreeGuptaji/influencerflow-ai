# InfluencerFlow AI Platform

InfluencerFlow AI is a cutting-edge influencer marketing platform that helps brands discover, negotiate with, and manage creator relationships through AI-powered tools. Our key differentiator is the AI voice negotiation system that automates deal-making.

## 🚀 Core Features

- **AI-powered Creator Database:** Find the perfect creators for your campaigns
- **Campaign Management:** Create and manage influencer campaigns
- **Voice & Text Negotiation:** AI agents negotiate with creators on your behalf
- **Contract Generation:** Automated contracts from negotiated terms
- **Payment Processing:** Secure, milestone-based payments

## 📋 Project Specifications

Detailed specifications for each feature can be found in the `specs` directory:

- [Implementation Plan](specs/00-implementation-plan.md)
- [AI Matching System](specs/01-ai-matching.md)
- [Negotiation System](specs/02-negotiation-system.md)
- [Contract Generation](specs/03-contract-generation.md)
- [Payment Processing](specs/04-payment-processing.md)
- [Database Schema Updates](specs/05-database-schema-updates.md)

## 💻 Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** tRPC, Prisma, PostgreSQL
- **Authentication:** Next-Auth
- **AI/Voice:** OpenAI GPT-4, ElevenLabs, OpenAI Whisper
- **Payments:** Stripe
- **Docs:** React-PDF

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/             # API endpoints
│   ├── _components/     # Shared UI components
│   ├── database/        # Creator database view
│   ├── campaigns/       # Campaign management
│   │   ├── [id]/        # Individual campaign view
│   │   ├── create/      # Campaign creation
│   │   └── negotiate/   # Voice negotiation interface
│   ├── layout.tsx       # Main layout with navigation
│   └── page.tsx         # Landing page
├── components/          # UI components (shadcn/ui)
├── lib/                 # Utility functions
├── server/              # Server-side code
│   ├── api/             # API route handlers
│   ├── auth.ts          # Authentication setup
│   └── db.ts            # Database client
└── trpc/                # tRPC setup and routers
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/influenceflowai.git
cd influenceflowai
```

2. Install dependencies

```bash
npm install
```

3. Set up your environment variables

```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

4. Start the database

```bash
./start-database.sh
```

5. Run migrations and seed the database

```bash
npx prisma migrate dev
npx prisma db seed
```

6. Start the development server

```bash
npm run dev
```

## 🧪 Development Approach

We follow a phased implementation approach:

1. **Phase 1:** Core Infrastructure & API Development
2. **Phase 2:** AI Matching System
3. **Phase 3:** Negotiation System (Text & Voice)
4. **Phase 4:** Contract & Payment Systems
5. **Phase 5:** Testing & Refinement

See the [Implementation Plan](specs/00-implementation-plan.md) for detailed timelines.

## 🤝 Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) before submitting changes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# Email Configuration for InfluenceFlow Negotiation System

This project includes a robust email communication system for negotiation conversations between brands and creators. Below are instructions for setting up the email functionality.

## Environment Variables

Add the following environment variables to your `.env` file:

```
# Email Configuration Options (SMTP vs Gmail OAuth2)
# You can either use SMTP or Gmail OAuth2 for email delivery

# Option 1: SMTP Configuration
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM_NAME="InfluenceFlow AI"
EMAIL_FROM_ADDRESS="noreply@influenceflow.ai"
EMAIL_REPLY_TO="support@influenceflow.ai"
EMAIL_SECURE="false" # Set to "true" for port 465

# Option 2: Gmail OAuth2 Configuration (Preferred for production)
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REFRESH_TOKEN="your-gmail-refresh-token"
GMAIL_REDIRECT_URI="https://developers.google.com/oauthplayground" # Default OAuth Playground URI

# Email Webhook Security
EMAIL_WEBHOOK_SECRET="your-webhook-secret-key" # Used to validate incoming email webhooks
```

## Setting up Gmail OAuth2

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project
4. Configure the OAuth consent screen:
   - Set the user type to "External"
   - Add the `https://mail.google.com/` scope
   - Add your email as a test user
5. Create OAuth2 credentials:
   - Choose "Web application" as the application type
   - Add `https://developers.google.com/oauthplayground` as an authorized redirect URI
   - Copy the Client ID and Client Secret
6. Get a refresh token:
   - Go to [OAuth Playground](https://developers.google.com/oauthplayground/)
   - Click the gear icon in the top right and check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - Select "Gmail API v1 > https://mail.google.com/" from the list
   - Click "Authorize APIs" and follow the prompts
   - Click "Exchange authorization code for tokens"
   - Copy the refresh token

## Email Webhook Setup

To receive email replies, you'll need to set up a webhook endpoint. This project includes a webhook handler at `/api/webhooks/email`. Use an email service that supports webhook notifications, such as:

- [Sendgrid Inbound Parse](https://docs.sendgrid.com/for-developers/parsing-email/inbound-email)
- [Mailgun Inbound Routing](https://documentation.mailgun.com/en/latest/user_manual.html#receiving-forwarding-and-storing-messages)
- [Postmark Inbound](https://postmarkapp.com/developer/user-guide/inbound)

Configure your email service to forward inbound emails to your webhook URL with the secret:

```
https://yourdomain.com/api/webhooks/email
```

Add the `x-webhook-secret` header with your `EMAIL_WEBHOOK_SECRET` value to secure the webhook.
