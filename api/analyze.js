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
    console.log("Analyzing contract address:", contractAddress);

    // Alchemy API Call
    const alchemyResponse = await axios.get(
      `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
      {
        params: {
          module: "contract",
          action: "getsourcecode",
          address: contractAddress,
        },
      }
    );

    console.log("Alchemy Response:", alchemyResponse.data);

    if (!alchemyResponse.data || !alchemyResponse.data.result) {
      return res.status(500).json({ error: "Invalid Alchemy response." });
    }

    const contractSourceCode = alchemyResponse.data.result[0]?.SourceCode || "No source code found";
    
    // OpenAI API Call
    const aiResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Analyze this Ethereum contract:\n\n${contractSourceCode}`,
      max_tokens: 100,
    });

    console.log("OpenAI Response:", aiResponse.data);

    res.json({ analysis: aiResponse.data.choices[0].text.trim() });
  } catch (error) {
    console.error("Error occurred:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
