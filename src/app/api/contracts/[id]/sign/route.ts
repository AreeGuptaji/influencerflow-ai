import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ContractStatus, PaymentType, PaymentStatus } from "@prisma/client";
import { z } from "zod";

// Validation schema for contract signing
const signContractSchema = z.object({
  creatorName: z.string().min(1, "Name is required"),
  creatorEmail: z.string().email("Valid email is required"),
  bankDetails: z
    .object({
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
    })
    .optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    console.log("Contract signing request received for ID:", params.id);

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Validate request data
    const validationResult = signContractSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.flatten());
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { creatorName, creatorEmail } = validationResult.data;
    console.log("Validated data:", { creatorName, creatorEmail });

    // Find the contract
    let contract;
    try {
      contract = await db.contract.findUnique({
        where: { id: params.id },
        include: { negotiation: true },
      });

      if (!contract) {
        console.error("Contract not found:", params.id);
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 },
        );
      }

      console.log("Found contract:", {
        id: contract.id,
        status: contract.status,
        creatorId: contract.creatorId,
      });
    } catch (findError) {
      console.error("Error finding contract:", findError);
      return NextResponse.json(
        { error: "Database error while finding contract" },
        { status: 500 },
      );
    }

    // Check contract status
    if (contract.status !== ContractStatus.SENT) {
      console.error("Contract in wrong state:", contract.status);
      return NextResponse.json(
        { error: "Contract cannot be signed in its current state" },
        { status: 400 },
      );
    }

    // Update contract - basic update only
    try {
      console.log("Updating contract status...");
      const updatedContract = await db.contract.update({
        where: { id: params.id },
        data: {
          status: ContractStatus.SIGNED,
          signedByCreator: true,
          creatorSignedAt: new Date(),
        },
      });

      console.log("Contract updated successfully");

      // Handle bank details separately if provided
      const bankDetails = validationResult.data.bankDetails;
      if (bankDetails) {
        try {
          console.log("Updating payment details separately...");
          await db.contract.update({
            where: { id: params.id },
            data: {
              paymentDetails: bankDetails,
            },
          });
          console.log("Payment details updated successfully");
        } catch (detailsError) {
          console.error("Error updating payment details:", detailsError);
          // Continue - we don't want to fail the whole operation
        }
      }

      // Create payment record if both parties have signed
      if (updatedContract.signedByBrand && updatedContract.signedByCreator) {
        try {
          console.log("Both parties have signed, creating payment record...");

          // Get full contract with campaign data
          const fullContract = await db.contract.findUnique({
            where: { id: params.id },
            include: { campaign: true },
          });

          if (!fullContract) {
            throw new Error("Contract not found after update");
          }

          // Calculate total contract value from deliverables
          const deliverables = fullContract.deliverables
            ? (fullContract.deliverables as any as { amount: number }[])
            : [];

          const totalContractValue = deliverables.reduce(
            (sum, deliverable) => sum + (deliverable.amount || 0),
            0,
          );

          if (totalContractValue > 0) {
            // Create a payment record
            const payment = await db.payment.create({
              data: {
                campaignId: fullContract.campaignId,
                contractId: fullContract.id,
                creatorId: fullContract.creatorId,
                amount: totalContractValue,
                type: PaymentType.DEPOSIT,
                status: PaymentStatus.PENDING,
                description: `Payment for contract with ${creatorName}`,
              },
            });

            console.log("Created payment record:", payment.id);
          } else {
            console.log("No payment record created - contract value is zero");
          }
        } catch (paymentError) {
          console.error("Error creating payment record:", paymentError);
          // Continue - we don't want to fail the whole operation
        }
      } else {
        console.log(
          "Contract not signed by both parties yet, skipping payment record creation",
        );
      }

      return NextResponse.json({
        message: "Contract signed successfully",
        contractId: updatedContract.id,
      });
    } catch (updateError) {
      console.error("Error updating contract:", updateError);
      return NextResponse.json(
        { error: "Failed to update contract" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Unexpected error in contract signing:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
