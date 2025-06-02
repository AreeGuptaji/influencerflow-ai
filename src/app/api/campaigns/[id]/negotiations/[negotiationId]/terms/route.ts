import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { NegotiationStatus } from "@prisma/client";
import { z } from "zod";

// Validation schema for deal terms
const dealTermsSchema = z.object({
  fee: z.number().min(0),
  deliverables: z.array(z.string()).min(1),
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string(),
    milestones: z
      .array(
        z.object({
          date: z.string(),
          description: z.string(),
        }),
      )
      .optional(),
  }),
  requirements: z.array(z.string()),
  revisions: z.number().min(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; negotiationId: string }> },
) {
  try {
    const session = await auth();
    const { id, negotiationId } = await params;

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get negotiation to verify access
    const negotiation = await db.negotiation.findUnique({
      where: {
        id: negotiationId,
      },
      include: {
        campaign: {
          select: {
            brandId: true,
          },
        },
        terms: true,
      },
    });

    if (!negotiation || negotiation.campaign.brandId !== session.user.id) {
      return NextResponse.json(
        { error: "Negotiation not found or you don't have access" },
        { status: 404 },
      );
    }

    // Check if terms already exist
    if (negotiation.terms) {
      return NextResponse.json(
        {
          error: "Terms already exist for this negotiation. Use PUT to update.",
        },
        { status: 400 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = dealTermsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { fee, deliverables, timeline, requirements, revisions } =
      validationResult.data;

    // Create the deal terms
    const terms = await db.dealTerms.create({
      data: {
        negotiationId: negotiation.id,
        fee,
        deliverables,
        timeline,
        requirements,
        revisions,
      },
    });

    // Update negotiation status to TERMS_PROPOSED
    await db.negotiation.update({
      where: {
        id: negotiation.id,
      },
      data: {
        status: NegotiationStatus.TERMS_PROPOSED,
      },
    });

    return NextResponse.json(
      { message: "Deal terms created successfully", termsId: terms.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating deal terms:", error);
    return NextResponse.json(
      { error: "Failed to create deal terms" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; negotiationId: string }> },
) {
  try {
    const session = await auth();
    const { id, negotiationId } = await params;

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get negotiation to verify access
    const negotiation = await db.negotiation.findUnique({
      where: {
        id: negotiationId,
      },
      include: {
        campaign: {
          select: {
            brandId: true,
          },
        },
        terms: true,
      },
    });

    if (!negotiation || negotiation.campaign.brandId !== session.user.id) {
      return NextResponse.json(
        { error: "Negotiation not found or you don't have access" },
        { status: 404 },
      );
    }

    // Check if terms exist
    if (!negotiation.terms) {
      return NextResponse.json(
        {
          error: "Terms don't exist for this negotiation. Use POST to create.",
        },
        { status: 400 },
      );
    }

    // Don't allow updates to approved terms
    if (negotiation.terms.approvedAt) {
      return NextResponse.json(
        { error: "Cannot update already approved terms" },
        { status: 400 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = dealTermsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { fee, deliverables, timeline, requirements, revisions } =
      validationResult.data;

    // Update the deal terms
    const terms = await db.dealTerms.update({
      where: {
        id: negotiation.terms.id,
      },
      data: {
        fee,
        deliverables,
        timeline,
        requirements,
        revisions,
      },
    });

    return NextResponse.json(
      { message: "Deal terms updated successfully", termsId: terms.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating deal terms:", error);
    return NextResponse.json(
      { error: "Failed to update deal terms" },
      { status: 500 },
    );
  }
}
