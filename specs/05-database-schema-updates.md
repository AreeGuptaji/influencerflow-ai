# Database Schema Updates Specification

## Overview

This document outlines the database schema updates required to support all planned features of the InfluencerFlow AI platform. It builds upon the existing schema and adds new models for negotiation, contract generation, payment processing, and AI matching.

## Current Schema

The platform currently has the following models:

- User
- BrandProfile
- CreatorProfile
- Campaign

## Required Schema Updates

### 1. Negotiation System

```typescript
// Negotiation status enum
enum NegotiationStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

// Negotiation mode enum
enum NegotiationMode {
  TEXT
  VOICE
}

// Message sender enum
enum MessageSender {
  BRAND
  CREATOR
  AI
}

// Message type enum
enum MessageType {
  TEXT
  AUDIO
}

// Negotiation model
model Negotiation {
  id            String            @id @default(cuid())
  campaignId    String
  creatorId     String
  status        NegotiationStatus @default(PENDING)
  mode          NegotiationMode   @default(TEXT)
  parameters    Json              // Brand's negotiation parameters
  messages      Message[]         // Conversation history
  terms         DealTerms?        // Extracted deal terms
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  campaign      Campaign          @relation(fields: [campaignId], references: [id])
  contracts     Contract[]
}

// Message model for conversation history
model Message {
  id            String          @id @default(cuid())
  negotiationId String
  sender        MessageSender   // BRAND, CREATOR, or AI
  content       String
  contentType   MessageType     // TEXT or AUDIO
  audioUrl      String?         // For voice messages
  timestamp     DateTime        @default(now())

  negotiation   Negotiation     @relation(fields: [negotiationId], references: [id])
}

// Deal terms extracted from negotiation
model DealTerms {
  id            String          @id @default(cuid())
  negotiationId String          @unique
  fee           Int             // Agreed payment amount
  deliverables  String[]        // Content deliverables
  timeline      Json            // Timeline details
  requirements  String[]        // Special requirements
  revisions     Int             // Number of revisions allowed
  approvedAt    DateTime?       // When terms were approved

  negotiation   Negotiation     @relation(fields: [negotiationId], references: [id])
}
```

### 2. Contract Generation

```typescript
// Contract status enum
enum ContractStatus {
  DRAFT
  SENT
  SIGNED
  CANCELED
}

// Contract model
model Contract {
  id              String          @id @default(cuid())
  campaignId      String
  creatorId       String
  negotiationId   String?
  status          ContractStatus  @default(DRAFT)
  content         String          // Full contract content
  version         Int             @default(1)
  signedByBrand   Boolean         @default(false)
  signedByCreator Boolean         @default(false)
  brandSignedAt   DateTime?
  creatorSignedAt DateTime?
  pdfUrl          String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  campaign        Campaign        @relation(fields: [campaignId], references: [id])
  negotiation     Negotiation?    @relation(fields: [negotiationId], references: [id])
  payments        Payment[]
}

// ContractTemplate model
model ContractTemplate {
  id              String          @id @default(cuid())
  name            String
  description     String
  content         String
  variables       String[]        // Variables that can be substituted
  isDefault       Boolean         @default(false)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

// ContractClause library
model ContractClause {
  id              String          @id @default(cuid())
  name            String
  category        String          // e.g., "payment", "deliverables", "rights"
  content         String
  isRequired      Boolean         @default(false)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

### 3. Payment Processing

```typescript
// Payment type enum
enum PaymentType {
  DEPOSIT
  MILESTONE
  FINAL
}

// Payment status enum
enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// Milestone status enum
enum MilestoneStatus {
  PENDING
  COMPLETED
  OVERDUE
}

// Payment model
model Payment {
  id                String          @id @default(cuid())
  campaignId        String
  creatorId         String
  contractId        String?
  amount            Int             // Amount in cents
  currency          String          @default("USD")
  type              PaymentType     @default(DEPOSIT)
  status            PaymentStatus   @default(PENDING)
  description       String?
  stripePaymentId   String?
  stripeSessionId   String?
  invoiceUrl        String?
  receiptUrl        String?
  milestones        PaymentMilestone[]
  createdAt         DateTime        @default(now())
  completedAt       DateTime?

  campaign          Campaign        @relation(fields: [campaignId], references: [id])
  contract          Contract?       @relation(fields: [contractId], references: [id])
}

// PaymentMilestone model
model PaymentMilestone {
  id                String          @id @default(cuid())
  paymentId         String
  name              String
  description       String?
  amount            Int             // Amount in cents
  dueDate           DateTime?
  completedDate     DateTime?
  status            MilestoneStatus @default(PENDING)
  deliverables      String[]

  payment           Payment         @relation(fields: [paymentId], references: [id])
}

// PaymentMethod model (for brands)
model PaymentMethod {
  id                String          @id @default(cuid())
  userId            String
  type              String          // CARD, BANK_ACCOUNT
  name              String
  lastFour          String
  isDefault         Boolean         @default(false)
  stripeMethodId    String
  expiryDate        DateTime?       // For cards
  createdAt         DateTime        @default(now())

  user              User            @relation(fields: [userId], references: [id])
}
```

### 4. AI Matching System

```typescript
// CreatorMatch model to track recommendations
model CreatorMatch {
  id              String          @id @default(cuid())
  campaignId      String
  creatorId       String
  matchScore      Float           // 0-100 score representing match quality
  matchFactors    Json            // Detailed breakdown of matching factors
  isSelected      Boolean         @default(false)
  createdAt       DateTime        @default(now())

  campaign        Campaign        @relation(fields: [campaignId], references: [id])
}
```

### 5. Updates to Existing Models

```typescript
// Updates to Campaign model
model Campaign {
  // Existing fields
  id           String         @id @default(cuid())
  title        String
  description  String
  budget       Int
  startDate    DateTime
  endDate      DateTime
  status       CampaignStatus @default(DRAFT)
  niches       String[]       // Target niches
  location     String?
  minFollowers Int?
  maxFollowers Int?
  brandId      String
  brand        User           @relation(fields: [brandId], references: [id])
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  // New relations
  negotiations   Negotiation[]
  contracts      Contract[]
  payments       Payment[]
  creatorMatches CreatorMatch[]
  selectedCreators String[]    // IDs of selected creators

  @@index([status])
  @@index([brandId])
}

// Updates to User model
model User {
  // Existing fields
  id                 String    @id @default(cuid())
  name               String?
  email              String?   @unique
  emailVerified      DateTime?
  image              String?
  role               UserRole?
  onboardingComplete Boolean   @default(false)
  accounts           Account[]
  sessions           Session[]
  posts              Post[]
  brandProfile       BrandProfile?
  creatorProfile     CreatorProfile?
  campaigns          Campaign[]

  // New relations
  paymentMethods     PaymentMethod[]
}
```

## Migration Strategy

The database updates will be implemented in the following order:

1. Add all new enum types
2. Add Negotiation and Message models
3. Add Contract-related models
4. Add Payment-related models
5. Add CreatorMatch model
6. Update existing models with new relations
7. Create appropriate indexes for query optimization

## Data Seeding

For development and testing, we will seed the database with:

1. Sample negotiations with conversation history
2. Contract templates with variables
3. Contract clauses for different scenarios
4. Mock payment records with various statuses
5. Creator match examples with match scores

## Schema Validation

Before deploying, we will:

1. Verify all relations are properly defined
2. Ensure appropriate indexes for query performance
3. Test foreign key constraints
4. Validate enum types and default values

## Implementation Timeline

| Task                      | Duration | Dependencies      |
| ------------------------- | -------- | ----------------- |
| Define all schema changes | 1 day    | None              |
| Create migration files    | 0.5 day  | Schema definition |
| Update Prisma client      | 0.5 day  | Migrations        |
| Seed development data     | 1 day    | Schema updates    |
| Test and validate         | 1 day    | All above tasks   |

**Total Duration: 4 days**
