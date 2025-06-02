import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/server/db";
import stripe from "@/lib/stripe";
import { env } from "@/env";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const sig = headersList.get("stripe-signature") ?? "";

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        env.STRIPE_WEBHOOK_SECRET ?? "",
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`Webhook signature verification failed: ${errorMessage}`);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 },
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "transfer.created":
        console.log("Transfer created event received");
        // Handle transfer created (payout to creator)
        break;

      case "transfer.failed":
        console.log("Transfer failed event received");
        // Handle transfer failed (payout to creator failed)
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  if (!session.id) {
    console.error("Session ID is missing");
    return;
  }

  // Find the payment by the Stripe session ID
  const payment = await db.payment.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (!payment) {
    console.error(`Payment not found for session: ${session.id}`);
    return;
  }

  // Update the payment status
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      stripePaymentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
      completedAt: new Date(),
    },
  });

  console.log(`Payment ${payment.id} marked as completed`);
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  // This is where you would handle successful creator payouts
  console.log(`Transfer created: ${transfer.id}`);
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  // This is where you would handle failed creator payouts
  console.log(`Transfer failed: ${transfer.id}`);
}
