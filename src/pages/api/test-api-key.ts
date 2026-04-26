import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ success: false, message: "Provider and API key are required" });
  }

  try {
    let modelCount = 0;
    let message = "API klíč je platný!";

    switch (provider) {
      case "openai": {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error("Neplatný OpenAI klíč");
        const data = await response.json();
        modelCount = data.data.length;
        message = `OpenAI API klíč je platný! Dostupné modely: ${modelCount}`;
        break;
      }
      case "anthropic": {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "Hi" }]
          })
        });
        if (response.status === 401) throw new Error("Neplatný Anthropic klíč");
        message = `Anthropic API klíč je platný!`;
        break;
      }
      case "google": {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) throw new Error("Neplatný Google klíč");
        const data = await response.json();
        modelCount = data.models?.length || 0;
        message = `Google API klíč je platný! Dostupné modely: ${modelCount}`;
        break;
      }
      case "mistral": {
        const response = await fetch("https://api.mistral.ai/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error("Neplatný Mistral klíč");
        const data = await response.json();
        modelCount = data.data?.length || 0;
        message = `Mistral API klíč je platný! Dostupné modely: ${modelCount}`;
        break;
      }
      case "xai": {
        const response = await fetch("https://api.x.ai/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error("Neplatný X AI klíč");
        const data = await response.json();
        modelCount = data.data?.length || 0;
        message = `X AI API klíč je platný! Dostupné modely: ${modelCount}`;
        break;
      }
      default:
        message = `${provider} API klíč byl přijat. (Specifický test endpoint zatím není implementován)`;
        break;
    }

    return res.status(200).json({ success: true, message });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}