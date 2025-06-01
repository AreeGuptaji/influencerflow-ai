# Negotiation System Specification

## Overview

The negotiation system is our platform's key differentiator, allowing brands to conduct AI-powered negotiations with creators through both voice and text interfaces. This system will handle the entire negotiation process, from initiating contact to finalizing deal terms.

## User Stories

1. As a brand, I want to negotiate with creators using voice or text
2. As a brand, I want to set negotiation parameters (budget range, deliverables, timeline)
3. As a brand, I want the AI to handle negotiations based on my requirements
4. As a brand, I want to see the negotiation history and extracted terms
5. As a brand, I want to finalize deals after successful negotiations

## Technical Implementation

### Dual-Mode Negotiation

The system will provide two primary negotiation modes:

1. **Voice Negotiation:**
   - Real-time voice synthesis using ElevenLabs
   - Speech-to-text processing with OpenAI Whisper
   - Voice-based conversation with AI agent acting on brand's behalf
2. **Text Negotiation:**
   - Chat-like interface for text-based communication
   - Real-time messaging with AI agent
   - Text-based negotiation with deal terms extraction

### Components

#### Backend Components:

1. **Negotiation API Routes:**

   - `src/app/api/campaigns/[id]/negotiations/[creatorId]` - Main negotiation endpoint
   - `src/app/api/negotiations/voice` - Voice processing endpoint
   - `src/app/api/negotiations/terms` - Deal terms extraction endpoint

2. **AI Integration:**

   - GPT-4 for conversation management and negotiation strategy
   - Prompt engineering for negotiation parameters
   - Function calling for extracting structured deal data

3. **Voice Services:**
   - ElevenLabs integration for realistic voice synthesis
   - OpenAI Whisper for accurate speech-to-text conversion
   - WebRTC for real-time audio streaming

#### Frontend Components:

1. **Negotiation Interface:**

   - Location: `src/app/campaigns/[id]/negotiate/[creatorId]/page.tsx`
   - Tabbed interface for switching between voice and text modes
   - Negotiation parameter configuration panel
   - Conversation history display
   - Deal terms summary panel

2. **Voice Interface:**

   - Audio recording and playback controls
   - Voice activity visualization
   - Transcription display in real-time
   - Voice settings (voice selection, speed, etc.)

3. **Text Interface:**
   - Chat-like message display
   - Typing area with send button
   - Message status indicators
   - Emoji and reaction support

### Database Schema Updates

```typescript
// Negotiation model
model Negotiation {
  id            String          @id @default(cuid())
  campaignId    String
  creatorId     String
  status        NegotiationStatus
  mode          NegotiationMode // VOICE or TEXT
  parameters    Json            // Brand's negotiation parameters
  messages      Message[]       // Conversation history
  terms         DealTerms?      // Extracted deal terms
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  campaign      Campaign        @relation(fields: [campaignId], references: [id])
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

### Conversation Flow

1. Brand initiates negotiation and sets parameters
2. AI agent conducts conversation based on parameters
3. Creator (simulated for MVP) responds to offers
4. AI agent adjusts strategy based on responses
5. Terms are extracted when agreement is reached
6. Brand reviews and approves final terms

## Success Criteria

- ✅ Both voice and text negotiation interfaces function correctly
- ✅ AI can conduct negotiations based on brand parameters
- ✅ Deal terms are accurately extracted from conversations
- ✅ Conversation history is properly recorded and displayed
- ✅ Brands can review and finalize deals after negotiation

## Voice Integration Details

- **ElevenLabs API:** Used for voice synthesis with realistic, natural-sounding voices
- **Voice Selection:** Multiple voice options available for brand preference
- **Audio Processing:** Real-time processing for voice conversations
- **Fallback Mechanism:** Text mode available if voice services are unavailable

## Text Integration Details

- **Chat Interface:** Modern, responsive chat UI with typing indicators
- **Message Types:** Support for text, links, and emojis
- **Real-time Updates:** Immediate display of messages with status indicators
- **History Management:** Complete conversation history saved and accessible

## Implementation Timeline

1. Backend negotiation services (4 days)
2. Text negotiation interface (3 days)
3. Voice integration and interface (5 days)
4. Deal terms extraction logic (3 days)
5. Testing and refinement (5 days)

## Future Enhancements

- Multi-language negotiation support
- Advanced negotiation strategies based on creator metrics
- Voice emotion detection and response adaptation
- Integration with creator calendar for scheduling discussions
