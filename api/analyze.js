const express = require("express");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

app.post("/api/analyze", async (req, res) => {
  const { contractAddress } = req.body;

  if (!contractAddress) {
    return res.status(400).json({ error: "Contract address is required." });
  }

  try {
    // Gunakan OpenAI untuk analisis sederhana
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Analyze this Ethereum contract: ${contractAddress}`,
      max_tokens: 100,
    });

    const analysis = response.data.choices[0].text.trim();
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
