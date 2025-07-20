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
    const { lessonType, participants, currency = "jpy", coupon, userId, paymentMethodId } = body;
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

    // Stripe Promotion Code validation
    let promotionCodeId = null;
    if (coupon) {
      const promo = await stripe.promotionCodes.list({ code: coupon, active: true, limit: 1 });
      if (promo.data.length > 0) {
        promotionCodeId = promo.data[0].id;
      } else {
        return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
      }
    }

    // If coupon makes price 0, skip payment intent and return success
    if (promotionCodeId) {
      // Get the coupon object to check discount type
      const promoObj = await stripe.promotionCodes.retrieve(promotionCodeId);
      // promoObj.coupon can be a string or a Coupon object
      const couponId = typeof promoObj.coupon === 'string' ? promoObj.coupon : promoObj.coupon.id;
      const couponObj = await stripe.coupons.retrieve(couponId);
      let discountedAmount = amount;
      if (couponObj.amount_off) {
        discountedAmount = Math.max(0, amount - couponObj.amount_off);
      } else if (couponObj.percent_off) {
        discountedAmount = Math.max(0, Math.floor(amount * (1 - couponObj.percent_off / 100)));
      }
      if (discountedAmount === 0) {
        // No payment needed
        return NextResponse.json({ clientSecret: null, free: true, finalAmount: 0 });
      }
      amount = discountedAmount;
    }

    // Get customer ID if userId is provided
    let stripeCustomerId: string | undefined;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      
      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      ...(stripeCustomerId && { customer: stripeCustomerId }),
      ...(paymentMethodId && { payment_method: paymentMethodId }),
      ...(paymentMethodId && { confirmation_method: 'manual', confirm: true }),
      ...(promotionCodeId && { discounts: [{ promotion_code: promotionCodeId }] }),
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret, finalAmount: amount });
  } catch (err: unknown) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Failed to create PaymentIntent") }, { status: 500 });
  }
}
