const { createCheckoutSession } = require("../services/stripeService");

const subscribe = async (req, res) => {
  const tenantId = req.user.tenantId;

  const session = await createCheckoutSession(tenantId);

  res.json({ url: session.url });
};

module.exports = { subscribe };