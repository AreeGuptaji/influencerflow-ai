import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import stripe from "@/lib/stripe";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { brandProfile: true },
    });

    if (!user || user.role !== UserRole.BRAND) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = (await req.json()) as {
      campaignId: string;
      amount: number;
      description?: string;
      returnUrl: string;
    };

    const { campaignId, amount, description, returnUrl } = body;

    if (!campaignId || !amount || !returnUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if campaign exists and belongs to brand
    const campaign = await db.campaign.findUnique({
      where: {
        id: campaignId,
        brandId: user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or not owned by brand" },
        { status: 404 },
      );
    }

    // Create a payment record in the database
    const payment = await db.payment.create({
      data: {
        campaignId,
        creatorId: "placeholder", // Will be filled later when contract is signed
        amount,
        type: "DEPOSIT",
        status: "PENDING",
        description: description ?? `Payment for campaign: ${campaign.title}`,
      },
    });

    // Create a Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Payment for campaign: ${campaign.title}`,
              description: description ?? "Campaign funds deposit",
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: payment.id,
        campaignId,
        userId: user.id,
      },
      mode: "payment",
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
    });

    // Update payment with Stripe session ID
    await db.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Error processing payment" },
      { status: 500 },
    );
  }
}
