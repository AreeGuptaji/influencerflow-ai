# Negotiation System Specification

## Overview

The negotiation system is a key platform feature, enabling brands to conduct AI-powered negotiations with creators primarily via email. The system will manage the entire email-based negotiation lifecycle, from initial outreach to finalizing deal terms, with all communications logged and visible on the platform for brand oversight.

## User Stories

1.  As a brand, I want to outreach to creators and negotiate terms with them via email, managed through the platform.
2.  As a brand, I want to set negotiation parameters (budget range, deliverables, timeline) that an AI agent will use.
3.  As a brand, I want the option for an AI agent to conduct email negotiations autonomously based on my requirements.
4.  As a brand, I want the option to manually manage email negotiations or take over from the AI agent if needed (assisted mode).
5.  As a brand, I want to see the complete email conversation history and extracted deal terms on the platform.
6.  As a brand, I want to finalize deals after successful email negotiations.
7.  As an AI agent, I need to send personalized emails to creators based on campaign and brand parameters.
8.  As an AI agent, I need to process email replies from creators and adjust my negotiation strategy.

## Technical Implementation

### Email-Centric Negotiation

The system will focus on asynchronous email communication:

1.  **AI-Powered Email Negotiation:**
    - AI agents send and receive emails on behalf of the brand.
    - Integration with email services (e.g., SendGrid, Mailgun, or Gmail API via Nodemailer) for sending and parsing incoming emails.
    - AI handles conversation flow, term discussion, and counter-offers based on brand-defined strategies and parameters.
2.  **Brand Oversight and Intervention:**
    - Platform interface for brands to monitor email threads.
    - Ability for brands to pause AI, manually draft/send emails, or resume AI control (Autonomous vs. Assisted modes).

### Components

#### Backend Components:

1.  **Negotiation API Routes:**

    - `src/app/api/campaigns/[id]/negotiations/[creatorId]` - Main negotiation endpoint (creatorId might represent an external creator profile).
    - `src/app/api/negotiations/email/send` - Endpoint for sending emails.
    - `src/app/api/negotiations/email/receive` - Endpoint/webhook for processing incoming emails.
    - `src/app/api/negotiations/terms` - Deal terms extraction endpoint (from email content).
    - `src/app/api/negotiations/mode` - Endpoint to switch AI mode (Autonomous/Assisted).

2.  **AI Integration:**

    - GPT-4 (or similar) for email drafting, understanding creator replies, and negotiation strategy.
    - Prompt engineering tailored for email communication and negotiation parameters.
    - Function calling for extracting structured deal data from email text.

3.  **Email Services:**
    - Integration with a transactional email provider for reliable sending and receiving.
    - Email parsing capabilities to handle replies, threads, and attachments (if any).
    - Dedicated email inboxes per campaign/agent for managing communications.

#### Frontend Components:

1.  **Negotiation Interface:**
    - Location: `src/app/campaigns/[id]/negotiate/[creatorId]/page.tsx` (or similar, focused on managing a specific negotiation).
    - Email conversation view (similar to an email client).
    - Negotiation parameter configuration panel.
    - Controls to switch between AI Autonomous and Assisted modes.
    - Manual email composer for Assisted mode.
    - Deal terms summary panel, populated from AI extraction.

### Database Schema Updates

```typescript
// Negotiation model
model Negotiation {
  id            String          @id @default(cuid())
  campaignId    String
  creatorId     String          // Identifier for the creator (could be email or internal ID)
  creatorEmail  String          // Creator's email address
  status        NegotiationStatus // e.g., PENDING_OUTREACH, OUTREACH_SENT, IN_PROGRESS, AGREED, FAILED, DONE
  channel       CommunicationChannel @default(EMAIL) // Initially EMAIL, future DMs etc.
  aiMode        AIMode          // AUTONOMOUS or ASSISTED
  parameters    Json            // Brand's negotiation parameters (budget, deliverables, etc.)
  messages      Message[]       // Conversation history (emails)
  terms         DealTerms?      // Extracted deal terms
  emailThreadId String?         @unique // To group emails in a thread for a given negotiation
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  campaign      Campaign        @relation(fields: [campaignId], references: [id])
  // Creator relation might be to an external profile or a slim Creator model
}

// Message model for conversation history
model Message {
  id            String          @id @default(cuid())
  negotiationId String
  sender        MessageSender   // BRAND (via AI or manual), CREATOR (inferred from email)
  content       String          // Email body (HTML or plain text)
  contentType   MessageType     @default(TEXT) // Could be EMAIL_TEXT, EMAIL_HTML
  emailMetadata Json?           // Subject, to, from, cc, messageId, inReplyTo, etc.
  timestamp     DateTime        @default(now())

  negotiation   Negotiation     @relation(fields: [negotiationId], references: [id])
}

// Deal terms extracted from negotiation
model DealTerms {
  id            String          @id @default(cuid())
  negotiationId String          @unique
  fee           Float           // Agreed payment amount
  deliverables  String[]        // Content deliverables
  timeline      Json            // Timeline details
  requirements  String[]        // Special requirements
  revisions     Int             // Number of revisions allowed
  approvedAt    DateTime?       // When terms were approved by the brand

  negotiation   Negotiation     @relation(fields: [negotiationId], references: [id])
}

enum NegotiationStatus {
  PENDING_OUTREACH
  OUTREACH_SENT
  IN_PROGRESS
  TERMS_PROPOSED
  AGREED
  REJECTED
  FAILED
  DONE
}

enum CommunicationChannel {
  EMAIL
  // Future: DM, VOICE_LOG, TEXT_LOG
}

enum AIMode {
  AUTONOMOUS
  ASSISTED
}

enum MessageSender {
  BRAND_AI
  BRAND_MANUAL
  CREATOR
}

enum MessageType {
  TEXT // For general content, could be email plain text
  EMAIL_HTML // For HTML email content
  // Future: AUDIO_TRANSCRIPT
}
```

### Conversation Flow (Email-Based)

1.  Brand defines campaign and negotiation parameters (budget, deliverables, target creator profile/email).
2.  Brand initiates negotiation for a specific creator.
3.  **AI Autonomous Mode (Default):**
    - AI agent crafts and sends an initial outreach email.
    - Platform ingests creator's email replies.
    - AI agent analyzes replies, formulates responses, and sends follow-up emails, negotiating terms.
    - AI extracts potential deal terms and presents them to the brand.
4.  **Assisted Mode (Brand choice or takeover):**
    - Brand can pause AI at any point.
    - Brand can review email history and manually draft/send replies via the platform.
    - Brand can provide instructions to AI for the next step, then re-engage autonomous mode.
5.  Once terms are agreed upon (either by AI or manually confirmed by brand), they are logged.
6.  Brand reviews and formally approves final terms on the platform.
7.  Negotiation is marked as 'DONE' or 'AGREED'.

## Success Criteria

- ✅ Brands can initiate and manage email-based negotiations via the platform.
- ✅ AI agent can autonomously conduct email outreach and negotiation based on brand parameters.
- ✅ Brands can switch between AI autonomous and assisted modes.
- ✅ Email conversation history is accurately captured and displayed on the platform.
- ✅ Deal terms are accurately extracted from email conversations and presented to the brand.
- ✅ Brands can review and finalize deals based on email negotiations.

## Email Integration Details

- **Email Service Provider:** Robust integration with a service like SendGrid, AWS SES, or Mailgun for sending and receiving emails.
- **Dedicated Inboxes:** System for managing dedicated email addresses for campaigns/agents to avoid conflicts and ensure proper threading.
- **Email Parsing:** Sophisticated parsing of incoming emails to extract sender, subject, body (text and HTML), and threading information (Message-ID, In-Reply-To).
- **Spam and Bounce Handling:** Mechanisms to track and manage email delivery issues.

## Deprioritized / Future Enhancements

- Real-time voice negotiation and on-platform direct text chat with creators.
- Multi-language negotiation support.
- Advanced negotiation strategies based on creator metrics beyond initial parameters.
- Integration with creator calendar for scheduling (if calls/meetings become part of a future hybrid flow).

## Implementation Timeline (Adjusted for Email Focus)

1.  Backend negotiation services for email (API, DB updates, basic AI structure) (5 days)
2.  Email service integration (sending & receiving emails) (3 days)
3.  Frontend email negotiation interface (conversation view, mode controls) (5 days)
4.  Deal terms extraction logic from email content (3 days)
5.  Testing and refinement (4 days)

Total Estimated: 20 days
