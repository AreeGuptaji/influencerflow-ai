import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { sendContractEmail } from "@/server/services/contract.service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to send contracts" },
        { status: 401 },
      );
    }

    try {
      // Find the contract
      const contract = await db.contract.findUnique({
        where: {
          id: params.id,
        },
        include: {
          campaign: true,
          negotiation: true,
        },
      });

      if (!contract) {
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 },
        );
      }

      // Verify ownership
      if (contract.campaign.brandId !== session.user.id) {
        return NextResponse.json(
          { error: "You don't have permission to send this contract" },
          { status: 403 },
        );
      }

      // Check if contract is already sent or signed
      if (contract.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Contract has already been sent or signed" },
          { status: 400 },
        );
      }

      // Send the contract via email
      const result = await sendContractEmail({
        contractId: params.id,
        includeMessage: true,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to send contract" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Contract sent successfully",
        contractId: result.contractId,
      });
    } catch (error) {
      console.error("Error accessing contract model:", error);
      return NextResponse.json(
        { error: "Contract functionality not available" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error sending contract:", error);
    return NextResponse.json(
      { error: "Failed to send contract" },
      { status: 500 },
    );
  }
}
