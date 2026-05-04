const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET);

const createCheckoutSession = async (tenantId) => {
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