// backend/services/stripeService.js

const Stripe = require("stripe");

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.warn("⚠️ Stripe not configured — billing disabled");
}

const stripe = stripeKey ? new Stripe(stripeKey) : null;

const createCheckoutSession = async (tenantId) => {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
    metadata: { tenantId },
  });
};

module.exports = { createCheckoutSession };