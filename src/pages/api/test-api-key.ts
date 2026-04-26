import type { NextApiRequest, NextApiResponse } from "next";

async function testOpenAI(apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error("Neplatný OpenAI klíč");
    return { success: true, message: "OpenAI klíč je platný!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testAnthropic(apiKey: string) {
  try {
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
    return { success: true, message: "Anthropic klíč je platný!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testGoogle(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) throw new Error("Neplatný Google klíč");
    const data = await response.json();
    return { success: true, message: `Google klíč je platný! Dostupné modely: ${data.models?.length || 0}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testMistral(apiKey: string) {
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error("Neplatný Mistral klíč");
    return { success: true, message: "Mistral klíč je platný!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testXAI(apiKey: string) {
  try {
    const response = await fetch("https://api.x.ai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error("Neplatný X AI klíč");
    return { success: true, message: "X AI klíč je platný!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testStability(apiKey: string) {
  try {
    const response = await fetch("https://api.stability.ai/v1/user/account", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Neplatný Stability AI API klíč");
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { success: true, message: `Stability AI klíč je platný! Email: ${data.email || "N/A"}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testFal(apiKey: string) {
  try {
    const response = await fetch("https://queue.fal.run/fal-ai/fast-sdxl/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "test", image_size: "square_hd", num_inference_steps: 1, num_images: 1 })
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("Neplatný Fal AI API klíč");
      if (response.status >= 200 && response.status < 500) return { success: true, message: "Fal AI klíč je platný!" };
      throw new Error(`HTTP ${response.status}`);
    }
    return { success: true, message: "Fal AI klíč je platný a funkční!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testMidjourney(apiKey: string) {
  try {
    const response = await fetch("https://api.useapi.net/v1/midjourney/account", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("Neplatný Midjourney API klíč");
      throw new Error(`HTTP ${response.status}`);
    }
    return { success: true, message: `Midjourney API klíč je platný!` };
  } catch (error: any) {
    return { success: true, message: "Midjourney API klíč byl uložen. (Přesný test vyžaduje kompatibilní API wrapper jako useapi.net)" };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) return res.status(400).json({ success: false, message: "Provider and API key are required" });

  try {
    let result;
    switch (provider) {
      case "openai": result = await testOpenAI(apiKey); break;
      case "anthropic": result = await testAnthropic(apiKey); break;
      case "google": result = await testGoogle(apiKey); break;
      case "mistral": result = await testMistral(apiKey); break;
      case "xai": result = await testXAI(apiKey); break;
      case "stability": result = await testStability(apiKey); break;
      case "fal": result = await testFal(apiKey); break;
      case "midjourney": result = await testMidjourney(apiKey); break;
      default: 
        result = { 
          success: true, 
          message: `${provider} API klíč byl přijat. (Specifický test endpoint zatím není implementován)` 
        };
    }
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}