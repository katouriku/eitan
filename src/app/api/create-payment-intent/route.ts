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
    const { amount = 4000, currency = "jpy" } = await req.json();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message || "Failed to create PaymentIntent" }, { status: 500 });
  }
}
