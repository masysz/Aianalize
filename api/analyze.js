const express = require("express");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());

const alchemyApiKey = process.env.ALCHEMY_API_KEY;
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

app.post("/api/analyze", async (req, res) => {
  const { contractAddress } = req.body;
  if (!contractAddress) {
    return res.status(400).json({ error: "Contract address is required." });
  }

  try {
    const alchemyResponse = await axios.get(
      `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
      { params: { module: "contract", action: "getsourcecode", address: contractAddress } }
    );

    const contractSourceCode = alchemyResponse.data.result[0]?.SourceCode || "No source code found";
    const aiResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Analyze this Ethereum contract:\n\n${contractSourceCode}`,
      max_tokens: 100,
    });

    res.json({ analysis: aiResponse.data.choices[0].text.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
