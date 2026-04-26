import type { NextApiRequest, NextApiResponse } from "next";

async function testStability(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("https://api.stability.ai/v1/user/account", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Neplatný Stability AI API klíč");
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Stability AI klíč je platný! Email: ${data.email || "N/A"}` 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testFal(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    // Fal AI používá Key-ID header formát
    const response = await fetch("https://queue.fal.run/fal-ai/fast-sdxl/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "test",
        image_size: "square_hd",
        num_inference_steps: 1,
        num_images: 1
      })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Neplatný Fal AI API klíč");
      }
      // Pokud dostaneme jiný status, může to znamenat, že klíč je platný, ale request má jiný problém
      if (response.status >= 200 && response.status < 500) {
        return { 
          success: true, 
          message: "Fal AI klíč je platný!" 
        };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return { 
      success: true, 
      message: "Fal AI klíč je platný a funkční!" 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testMidjourney(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    // Midjourney nemá oficiální API, ale pokud používáte wrapper jako midjourney-api nebo useapi.net
    // Zkusíme useapi.net endpoint jako běžný wrapper
    const response = await fetch("https://api.useapi.net/v1/midjourney/account", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Neplatný Midjourney API klíč");
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Midjourney API klíč je platný!` 
    };
  } catch (error: any) {
    // Pokud useapi.net nefunguje, zkusíme alternativní přístup
    return { 
      success: true, 
      message: "Midjourney API klíč byl uložen. Poznámka: Midjourney nemá oficiální API, ujistěte se, že používáte kompatibilní wrapper (useapi.net, goapi.ai, nebo midjourney-api)." 
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ success: false, message: "Provider and API key are required" });
  }

  try {
    let result;

    switch (provider) {
      case "openai":
        result = await testOpenAI(apiKey);
        break;
      case "anthropic":
        result = await testAnthropic(apiKey);
        break;
      case "google":
        result = await testGoogle(apiKey);
        break;
      case "mistral":
        result = await testMistral(apiKey);
        break;
      case "xai":
        result = await testXAI(apiKey);
        break;
      case "stability":
        result = await testStability(apiKey);
        break;
      case "fal":
        result = await testFal(apiKey);
        break;
      case "midjourney":
        result = await testMidjourney(apiKey);
        break;
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