import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Try to find the contract with limited information
    try {
      const contract = await db.contract.findUnique({
        where: {
          id: params.id,
        },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!contract) {
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 },
        );
      }

      // Return a limited view of the contract data
      return NextResponse.json({
        contract: {
          id: contract.id,
          content: contract.content,
          status: contract.status,
          version: contract.version,
          signedByBrand: contract.signedByBrand,
          signedByCreator: contract.signedByCreator,
          brandSignedAt: contract.brandSignedAt,
          creatorSignedAt: contract.creatorSignedAt,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
          campaign: {
            id: contract.campaign.id,
            title: contract.campaign.title,
          },
        },
      });
    } catch (error) {
      console.error("Error accessing contract model:", error);
      return NextResponse.json(
        { error: "Contract functionality not available" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error retrieving contract:", error);
    return NextResponse.json(
      { error: "Failed to retrieve contract" },
      { status: 500 },
    );
  }
}
