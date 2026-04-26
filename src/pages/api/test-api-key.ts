import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ success: false, message: "Provider a API klíč jsou povinné" });
  }

  try {
    let testResult: { success: boolean; message: string };

    switch (provider) {
      case "openai":
        testResult = await testOpenAI(apiKey);
        break;
      case "anthropic":
        testResult = await testAnthropic(apiKey);
        break;
      case "google":
        testResult = await testGoogle(apiKey);
        break;
      case "mistral":
        testResult = await testMistral(apiKey);
        break;
      case "xai":
        testResult = await testXAI(apiKey);
        break;
      case "stability":
        testResult = await testStability(apiKey);
        break;
      default:
        testResult = { 
          success: false, 
          message: `Test pro ${provider} ještě není implementován` 
        };
    }

    return res.status(200).json(testResult);
  } catch (error: any) {
    console.error("Test API key error:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Chyba při testování: ${error.message}` 
    });
  }
}

async function testOpenAI(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error?.message || "Neplatný API klíč" 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `API klíč funguje! Dostupné modely: ${data.data?.length || 0}` 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testAnthropic(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error?.message || "Neplatný API klíč" 
      };
    }

    return { success: true, message: "API klíč funguje správně!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testGoogle(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return { success: true, message: "Google API klíč je platný a funguje" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testMistral(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.message || "Neplatný API klíč" 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `API klíč funguje! Dostupné modely: ${data.data?.length || 0}` 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testXAI(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error?.message || "Neplatný API klíč" 
      };
    }

    return { success: true, message: "API klíč funguje správně!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testStability(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("https://api.stability.ai/v1/user/account", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return { 
        success: false, 
        message: "Neplatný API klíč" 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `API klíč funguje! Email: ${data.email || "N/A"}` 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testGoogleKey(apiKey: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return { success: true, message: "Google API klíč je platný a funguje" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}