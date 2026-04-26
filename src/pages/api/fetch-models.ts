import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: "Provider and API key are required" });
  }

  try {
    let models: string[] = [];

    switch (provider) {
      case "openai":
        models = await fetchOpenAIModels(apiKey);
        break;
      case "anthropic":
        models = await fetchAnthropicModels(apiKey);
        break;
      case "google":
        models = await fetchGoogleModels(apiKey);
        break;
      case "mistral":
        models = await fetchMistralModels(apiKey);
        break;
      case "xai":
        models = await fetchXAIModels(apiKey);
        break;
      case "stability":
        models = ["stable-diffusion-xl-1024-v1-0", "stable-diffusion-v1-6"];
        break;
      default:
        return res.status(400).json({ error: "Unknown provider" });
    }

    res.status(200).json({ models });
  } catch (error: any) {
    console.error("Fetch models error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch models" });
  }
}

async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch OpenAI models");
  }

  const data = await response.json();
  return data.data
    .filter((model: any) => model.id.includes("gpt"))
    .map((model: any) => model.id)
    .sort();
}

async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
  // Anthropic doesn't have a models list endpoint, return known models
  return [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307"
  ];
}

async function fetchGoogleModels(apiKey: string): Promise<string[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    {
      headers: { "Content-Type": "application/json" }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Google models");
  }

  const data = await response.json();
  return data.models
    .filter((model: any) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model: any) => model.name.replace("models/", ""))
    .sort();
}

async function fetchMistralModels(apiKey: string): Promise<string[]> {
  const response = await fetch("https://api.mistral.ai/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Mistral models");
  }

  const data = await response.json();
  return data.data.map((model: any) => model.id).sort();
}

async function fetchXAIModels(apiKey: string): Promise<string[]> {
  const response = await fetch("https://api.x.ai/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch X AI models");
  }

  const data = await response.json();
  return data.data.map((model: any) => model.id).sort();
}