# Payment Processing System Specification

## Overview

The payment processing system will handle financial transactions between brands and creators, including initial deposits, milestone payments, and final disbursements. This system ensures secure, traceable payments throughout the campaign lifecycle.

## User Stories

1. As a brand, I want to securely pay creators for their work
2. As a brand, I want to set up milestone-based payments tied to deliverables
3. As a brand, I want to view payment history and transaction status
4. As a brand, I want to receive invoices and payment receipts

## Technical Implementation

### Payment Flow

1. Brand sets up campaign budget → Allocates funds to creators
2. Brand approves contract → Amount from the Budget is locked up for the creator
3. Brand marks done on the deliverables → Amount is transferred to the creator's bank account details which was taken through the contract

### Components

#### Backend Components:

1. **Payment API Routes:**

   - `src/app/api/campaigns/[id]/payments` - Campaign payment management
   - `src/app/api/payments/process` - Payment processing endpoint
   - `src/app/api/payments/webhooks` - Payment service webhooks

2. **Payment Processing Logic:**

   - Stripe integration for secure payment processing
   - Payment status tracking and updates
   - Transaction record keeping
   - Payment verification and confirmation

3. **Invoice Generation:**
   - Automated invoice creation
   - Tax calculation and inclusion
   - Receipt generation for completed payments
   - Payment history tracking

#### Frontend Components:

1. **Payment Management Interface:**

   - Location: `src/app/campaigns/[id]/payments/page.tsx`
   - Payment dashboard with transaction history
   - Payment status tracking
   - Invoice and receipt access

2. **Payment Setup Interface:**

   - Location: `src/app/campaigns/[id]/payments/setup/page.tsx`
   - Payment method management
   - Budget allocation to creators
   - Milestone payment scheduling

3. **Checkout Components:**
   - Secure payment form
   - Payment confirmation flow
   - Error handling and retry mechanisms
   - Success confirmation

### Database Schema Updates

```typescript
// Payment model
model Payment {
  id                String          @id @default(cuid())
  campaignId        String
  creatorId         String
  contractId        String?
  amount            Int             // Amount in cents
  currency          String          @default("USD")
  type              PaymentType     // DEPOSIT, MILESTONE, FINAL
  status            PaymentStatus   // PENDING, PROCESSING, COMPLETED, FAILED
  description       String?
  stripePaymentId   String?
  stripeSessionId   String?
  invoiceUrl        String?
  receiptUrl        String?
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
  status            MilestoneStatus // PENDING, COMPLETED, OVERDUE
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

### Payment Processing Flow

1. **Payment Setup:**

   - Brand adds payment method to account
   - Brand allocates budget to campaign
   - System creates payment records with PENDING status

2. **Initial Payment:**

   - Brand approves contract and initiates payment
   - System creates Stripe payment session
   - Brand completes payment through Stripe
   - Webhook confirms payment completion
   - System updates payment status to COMPLETED

3. **Milestone Payments:**

   - System tracks deliverable completion
   - Brand confirms milestone completion
   - System triggers milestone payment
   - Payment processed through Stripe
   - Creator receives milestone payment

4. **Final Payment:**
   - Campaign marked as completed
   - Remaining balance calculated
   - Final payment processed
   - Campaign financial summary generated

## Security Considerations

- PCI compliance for all payment processing
- Secure storage of payment information
- Encryption of sensitive financial data
- Regular security audits and testing

## Integration with Stripe

- Stripe Elements for secure payment forms
- Stripe Connect for creator payouts
- Webhook handling for payment events
- Error handling and retry logic

## Success Criteria

- ✅ Secure payment processing with Stripe integration
- ✅ Milestone-based payment scheduling and tracking
- ✅ Complete payment history and transaction records
- ✅ Automated invoice and receipt generation
- ✅ Proper handling of payment failures and retries

## Implementation Timeline

1. Database schema updates (1 day)
2. Stripe integration setup (2 days)
3. Payment processing logic (3 days)
4. Payment management UI (3 days)
5. Milestone payment system (2 days)
6. Invoice and receipt generation (2 days)
7. Testing and security review (3 days)

## Future Enhancements

- Multiple currency support
- Escrow payment options
- Automated tax calculations
- Subscription-based payment models
- Advanced financial reporting and analytics
