const { askCopilot } = require("../services/copilotService");

const chat = async (req, res) => {
  const { message } = req.body;

  const reply = await askCopilot(message);

  res.json({ reply });
};

module.exports = { chat };