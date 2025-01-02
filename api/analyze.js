import { JsonRpcProvider } from 'ethers';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contractAddress } = req.body;

  if (!contractAddress) {
    return res.status(400).json({ error: "Contract address is required" });
  }

  // Alchemy RPC URL
  const alchemyBaseUrl = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

  try {
    // Setup Ethers provider
    const provider = new JsonRpcProvider(alchemyBaseUrl);

    // Fetch contract code
    const contractCode = await provider.getCode(contractAddress);

    // Check if the contract is valid
    if (contractCode === "0x" || !contractCode) {
      return res.status(404).json({ error: "Contract not found or is not a smart contract" });
    }

    // Send request to OpenAI for analysis
    const openAIResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI that analyzes Ethereum smart contract bytecode.",
          },
          {
            role: "user",
            content: `Analyze this smart contract bytecode: ${contractCode}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const analysis = openAIResponse.data.choices[0].message.content;

    // Return the analysis
    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Error analyzing contract:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to analyze contract" });
  }
}
