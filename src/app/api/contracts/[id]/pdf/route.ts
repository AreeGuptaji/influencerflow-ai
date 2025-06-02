import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to download contract PDFs" },
        { status: 401 },
      );
    }

    // Try to find the contract
    try {
      const contract = await db.contract.findUnique({
        where: {
          id: id,
        },
        include: {
          campaign: true,
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
          { error: "You don't have permission to access this contract" },
          { status: 403 },
        );
      }

      // Generate PDF
      // For now, we'll just return a text representation of the contract
      // In a production system, you would use a PDF generation library like react-pdf

      // Create a simple HTML version of the contract for now
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contract #${contract.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Contract #${contract.id}</h1>
          <div class="content">${contract.content.replace(/\n/g, "<br>")}</div>
        </body>
        </html>
      `;

      // Return HTML for now - in production you would generate a PDF
      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          // If this was a real PDF:
          // "Content-Type": "application/pdf",
          // "Content-Disposition": `attachment; filename="contract-${contract.id}.pdf"`,
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
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
