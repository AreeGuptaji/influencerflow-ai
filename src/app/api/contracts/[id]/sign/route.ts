import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ContractStatus } from "@prisma/client";
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Parse and validate request body
    const body = await req.json();
    const validationResult = signContractSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { creatorName, creatorEmail, bankDetails } = validationResult.data;

    try {
      // Find the contract
      const contract = await db.contract.findUnique({
        where: {
          id: id,
        },
        include: {
          negotiation: true,
        },
      });

      if (!contract) {
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 },
        );
      }

      // Verify that the contract can be signed
      if (contract.status !== ContractStatus.SENT) {
        return NextResponse.json(
          { error: "Contract cannot be signed in its current state" },
          { status: 400 },
        );
      }

      // Verify email matches the negotiation
      if (
        contract.negotiation &&
        contract.negotiation.creatorEmail.toLowerCase() !==
          creatorEmail.toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Email does not match the contract recipient" },
          { status: 403 },
        );
      }

      // Update contract to signed status
      const updatedContract = await db.contract.update({
        where: {
          id: id,
        },
        data: {
          status: ContractStatus.SIGNED,
          signedByCreator: true,
          creatorSignedAt: new Date(),
        },
      });

      // Store bank details if provided
      if (bankDetails && contract.negotiation) {
        // Update the negotiation with bank details
        await db.negotiation.update({
          where: { id: contract.negotiation.id },
          data: {
            parameters: {
              ...(contract.negotiation.parameters as object),
              bankDetails,
            },
          },
        });
      }

      // Send confirmation email to brand
      // In a real implementation, you would use an email service to notify the brand
      console.log(
        `Contract ${contract.id} has been signed by ${creatorName} (${creatorEmail})`,
      );

      return NextResponse.json({
        message: "Contract signed successfully",
        contractId: updatedContract.id,
      });
    } catch (error) {
      console.error("Error accessing contract model:", error);
      return NextResponse.json(
        { error: "Contract functionality not available" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error signing contract:", error);
    return NextResponse.json(
      { error: "Failed to sign contract" },
      { status: 500 },
    );
  }
}
