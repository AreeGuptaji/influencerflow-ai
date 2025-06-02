import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  type Negotiation,
  type Campaign,
  type DealTerms,
  type User,
} from "@prisma/client";

// Define types for negotiation with included relations
interface NegotiationWithRelations extends Negotiation {
  campaign: Campaign;
  terms: DealTerms | null;
}

// Define the contract status enum since it doesn't seem to be exported from @prisma/client yet
enum ContractStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  SIGNED = "SIGNED",
  CANCELED = "CANCELED",
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to generate a contract" },
        { status: 401 },
      );
    }

    // Parse request body
    const data = await req.json();
    const negotiationId = data.negotiationId as string;

    if (!negotiationId) {
      return NextResponse.json(
        { error: "Negotiation ID is required" },
        { status: 400 },
      );
    }

    // Get the negotiation with campaign and terms
    const negotiation = (await db.negotiation.findUnique({
      where: {
        id: negotiationId,
      },
      include: {
        campaign: true,
        terms: true,
      },
    })) as NegotiationWithRelations | null;

    if (!negotiation) {
      return NextResponse.json(
        { error: "Negotiation not found" },
        { status: 404 },
      );
    }

    // Check if user owns this campaign
    if (negotiation.campaign.brandId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to generate this contract" },
        { status: 403 },
      );
    }

    // Check if terms exist
    if (!negotiation.terms) {
      return NextResponse.json(
        { error: "No terms found to generate contract" },
        { status: 400 },
      );
    }

    try {
      // Check if contract already exists
      const existingContract = await db.contract.findUnique({
        where: {
          negotiationId: negotiationId,
        },
      });

      if (existingContract) {
        return NextResponse.json(
          {
            message: "Contract already exists",
            contractId: existingContract.id,
          },
          { status: 200 },
        );
      }
    } catch (error) {
      // Contract model might not exist yet, continue with creation
      console.log("Contract model may not exist yet, continuing with creation");
    }

    // First, let's check if the ContractTemplate table exists and has a default template
    let defaultTemplate = null;
    try {
      defaultTemplate = await db.contractTemplate.findFirst({
        where: {
          isDefault: true,
        },
      });
    } catch (error) {
      console.log(
        "ContractTemplate model may not exist yet, continuing with default template",
      );
    }

    // Generate contract content
    const contractContent = await generateContractContent(negotiation);

    try {
      // Create the contract
      const contract = await db.contract.create({
        data: {
          campaignId: negotiation.campaignId,
          creatorId: negotiation.creatorId,
          negotiationId: negotiation.id,
          status: ContractStatus.DRAFT,
          content: contractContent,
          version: 1,
        },
      });

      return NextResponse.json({
        message: "Contract generated successfully",
        contractId: contract.id,
      });
    } catch (error) {
      console.error("Error creating contract:", error);
      return NextResponse.json(
        {
          error:
            "Failed to create contract. Database schema may need to be updated.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error generating contract:", error);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 },
    );
  }
}

// Helper function to generate contract content
async function generateContractContent(
  negotiation: NegotiationWithRelations,
): Promise<string> {
  // Try to get the template, but don't fail if the model doesn't exist yet
  let template = null;
  try {
    template = await db.contractTemplate.findFirst({
      where: {
        isDefault: true,
      },
    });
  } catch (error) {
    console.log(
      "ContractTemplate model may not exist yet, using default template",
    );
  }

  let contractContent = template
    ? template.content
    : generateDefaultTemplateContent();

  // Get campaign and creator details
  const campaign = await db.campaign.findUnique({
    where: { id: negotiation.campaignId },
    include: { brand: { select: { name: true } } },
  });

  if (!negotiation.terms) {
    throw new Error("No terms found for negotiation");
  }

  // Replace variables in the template
  const brandName = campaign?.brand?.name || "Brand";
  const creatorName = negotiation.creatorEmail.split("@")[0] || "Creator";
  const fee = negotiation.terms.fee.toString();
  const deliverables = negotiation.terms.deliverables.join(", ");

  // Handle timeline data which could be stored as a JSON string or object
  let startDate = "";
  let endDate = "";

  if (typeof negotiation.terms.timeline === "string") {
    try {
      const timeline = JSON.parse(negotiation.terms.timeline);
      startDate = timeline.startDate || "";
      endDate = timeline.endDate || "";
    } catch (e) {
      console.error("Error parsing timeline JSON:", e);
    }
  } else {
    const timeline = negotiation.terms.timeline as any;
    startDate = timeline.startDate || "";
    endDate = timeline.endDate || "";
  }

  const requirements = negotiation.terms.requirements.join(", ");
  const revisions = negotiation.terms.revisions.toString();

  // Simple variable replacement
  contractContent = contractContent
    .replace(/\{BRAND_NAME\}/g, brandName)
    .replace(/\{CREATOR_NAME\}/g, creatorName)
    .replace(/\{FEE\}/g, fee)
    .replace(/\{DELIVERABLES\}/g, deliverables)
    .replace(/\{START_DATE\}/g, startDate)
    .replace(/\{END_DATE\}/g, endDate)
    .replace(/\{REQUIREMENTS\}/g, requirements)
    .replace(/\{REVISIONS\}/g, revisions);

  return contractContent;
}

// Function to generate a default template if none exists
function generateDefaultTemplateContent(): string {
  return `# INFLUENCER AGREEMENT

THIS INFLUENCER AGREEMENT (the "Agreement") is entered into as of the date of signature by both parties, by and between {BRAND_NAME} ("Brand") and {CREATOR_NAME} ("Influencer").

## 1. SERVICES

Influencer agrees to provide the following content creation and promotional services (the "Services") to Brand:

- {DELIVERABLES}

## 2. TERM

The term of this Agreement shall commence on {START_DATE} and continue through {END_DATE}, unless terminated earlier as provided herein.

## 3. COMPENSATION

In consideration for Influencer's performance of the Services, Brand shall pay Influencer a fee of ${"{FEE}"} (the "Fee"). Payment shall be made as follows:
- 50% upon signing of this Agreement
- 50% upon completion of the Services

## 4. CONTENT REQUIREMENTS

All content created by Influencer shall:
- {REQUIREMENTS}
- Comply with all applicable laws, regulations, and platform policies
- Not contain any defamatory, obscene, or offensive material

## 5. REVISIONS

Influencer shall make up to {REVISIONS} rounds of revisions to the content as requested by Brand.

## 6. INTELLECTUAL PROPERTY

Brand shall own all right, title, and interest in and to the content created by Influencer as part of the Services. Influencer hereby assigns to Brand all such right, title, and interest.

## 7. CONFIDENTIALITY

Influencer shall keep confidential all non-public information provided by Brand.

## 8. TERMINATION

Either party may terminate this Agreement upon written notice if the other party materially breaches this Agreement and fails to cure such breach within 10 days after receipt of written notice.

## 9. GOVERNING LAW

This Agreement shall be governed by the laws of the state of [State].

## 10. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements and understandings, whether written or oral.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.

BRAND: {BRAND_NAME}
Signature: _________________________
Date: _________________________

INFLUENCER: {CREATOR_NAME}
Signature: _________________________
Date: _________________________
`;
}
