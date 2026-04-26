import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, model, conversationId } = req.body;

    if (!message || !model) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create admin client with service role key
    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Determine provider from model name
    const provider = getProviderFromModel(model);
    console.log("Model:", model, "Provider:", provider);

    // Get API key from admin_settings
    const { data: setting, error: settingError } = await supabaseAdmin
      .from("admin_settings")
      .select("api_key")
      .eq("provider", provider)
      .single();

    if (settingError || !setting?.api_key) {
      console.error("API key not found for provider:", provider, settingError);
      return res.status(400).json({ 
        error: `API klíč pro ${provider} není nastaven. Přidejte ho v admin panelu.` 
      });
    }

    const apiKey = setting.api_key;

    // Call appropriate AI API based on provider
    let response: string;
    
    try {
      switch (provider) {
        case "openai":
          response = await callOpenAI(message, model, apiKey);
          break;
        case "anthropic":
          response = await callAnthropic(message, model, apiKey);
          break;
        case "google":
          response = await callGoogle(message, model, apiKey);
          break;
        case "mistral":
          response = await callMistral(message, model, apiKey);
          break;
        case "xai":
          response = await callXAI(message, model, apiKey);
          break;
        default:
          return res.status(400).json({ error: "Nepodporovaný AI model" });
      }

      return res.status(200).json({ response });
    } catch (apiError: any) {
      console.error("AI API Error:", apiError);
      return res.status(500).json({ 
        error: apiError.message || "Chyba při komunikaci s AI modelem" 
      });
    }
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ 
      error: error.message || "Nepodařilo se zpracovat požadavek" 
    });
  }
}

function getProviderFromModel(model: string): string {
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gemini")) return "google";
  if (model.startsWith("mistral")) return "mistral";
  if (model.startsWith("grok")) return "xai";
  return "openai"; // default
}

async function callOpenAI(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Nepodařilo se získat odpověď.";
}

async function callAnthropic(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API error");
  }

  const data = await response.json();
  return data.content[0]?.text || "Nepodařilo se získat odpověď.";
}

async function callGoogle(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Google AI API error");
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || "Nepodařilo se získat odpověď.";
}

async function callMistral(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Mistral API error");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Nepodařilo se získat odpověď.";
}

async function callXAI(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "X AI API error");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Nepodařilo se získat odpověď.";
}
