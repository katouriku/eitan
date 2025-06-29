import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}
const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lessonType, participants, currency = "jpy" } = body;
    // Validate and calculate amount on backend
    let base = 0;
    if (lessonType === "in-person") base = 3000;
    else if (lessonType === "online") base = 2500;
    let amount = base;
    if (lessonType === "in-person") amount += (participants - 1) * 1000;
    else if (lessonType === "online") amount += (participants - 1) * 500;
    // Fallback if invalid
    if (!lessonType || !participants || amount < 1) {
      return NextResponse.json({ error: "Invalid lesson type or participants" }, { status: 400 });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Failed to create PaymentIntent") }, { status: 500 });
  }
}
