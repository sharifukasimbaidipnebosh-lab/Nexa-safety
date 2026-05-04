const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function askCopilot(message) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You are NEXA aviation AI copilot." },
      { role: "user", content: message }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = { askCopilot };