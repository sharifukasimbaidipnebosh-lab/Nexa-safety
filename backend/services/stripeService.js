const Stripe = require("stripe");

// Debug (helps you confirm env is loaded)
console.log("Stripe key loaded:", !!process.env.STRIPE_SECRET_KEY);

// Safe initialization
let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("⚠️ Stripe not configured — billing disabled");
}

const createCheckoutSession = async (tenantId) => {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }
    ],
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
    metadata: { tenantId }
  });
};

module.exports = { createCheckoutSession };