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
