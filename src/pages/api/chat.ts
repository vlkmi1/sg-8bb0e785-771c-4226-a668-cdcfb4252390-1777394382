import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ChatRequest {
  message: string;
  model: string;
  conversationId?: string;
}

interface ChatResponse {
  response: string;
  error?: string;
}

async function getApiKey(provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("api_key")
    .eq("provider", provider)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data.api_key;
}

async function callOpenAI(apiKey: string, model: string, message: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, model: string, message: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API error");
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(apiKey: string, message: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: message }]
      }]
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Google API error");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callMistral(apiKey: string, model: string, message: string): Promise<string> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Mistral API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callXAI(apiKey: string, model: string, message: string): Promise<string> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "X AI API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ response: "", error: "Method not allowed" });
  }

  try {
    const { message, model } = req.body as ChatRequest;

    if (!message || !model) {
      return res.status(400).json({ response: "", error: "Message and model are required" });
    }

    // Determine provider from model
    let provider = "";
    const apiModel = model;

    if (model.startsWith("gpt-")) {
      provider = "openai";
    } else if (model.startsWith("claude-")) {
      provider = "anthropic";
    } else if (model.startsWith("gemini-")) {
      provider = "google";
    } else if (model.startsWith("mistral-")) {
      provider = "mistral";
    } else if (model.startsWith("grok-")) {
      provider = "xai";
    } else {
      return res.status(400).json({ response: "", error: "Unknown model" });
    }

    // Get API key
    const apiKey = await getApiKey(provider);
    if (!apiKey) {
      return res.status(500).json({ 
        response: "", 
        error: `API klíč pro ${provider} není nakonfigurován. Kontaktujte administrátora.` 
      });
    }

    // Call appropriate AI service
    let response: string;
    
    switch (provider) {
      case "openai":
        response = await callOpenAI(apiKey, apiModel, message);
        break;
      case "anthropic":
        response = await callAnthropic(apiKey, apiModel, message);
        break;
      case "google":
        response = await callGoogle(apiKey, message);
        break;
      case "mistral":
        response = await callMistral(apiKey, apiModel, message);
        break;
      case "xai":
        response = await callXAI(apiKey, apiModel, message);
        break;
      default:
        throw new Error("Unsupported provider");
    }

    return res.status(200).json({ response });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return res.status(500).json({ 
      response: "", 
      error: error.message || "Nepodařilo se získat odpověď od AI modelu" 
    });
  }
}