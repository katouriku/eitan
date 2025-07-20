import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}
const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-05-28.basil",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return NextResponse.json({ error: "Email and userId are required" }, { status: 400 });
    }

    // Check if customer already exists in Stripe
    let stripeCustomerId: string;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          supabase_user_id: userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Update user profile with stripe customer ID
    await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    // Create setup intent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ 
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    });
  } catch (err: unknown) {
    console.error("Setup intent error:", err);
    return NextResponse.json({ 
      error: (err instanceof Error ? err.message : "Failed to create setup intent") 
    }, { status: 500 });
  }
}
