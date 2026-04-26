import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Create admin client with service role key for reading admin_settings
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type immediately
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, model, conversationId } = req.body;

    if (!message || !model) {
      return res.status(400).json({ error: "Chybí povinná pole (message nebo model)" });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Environment Check:", {
      hasUrl: !!supabaseUrl,
      urlLength: supabaseUrl?.length,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + "..."
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      return res.status(500).json({ 
        error: "Server není správně nakonfigurován. Chybí environment variables." 
      });
    }

    // Determine provider from model name
    const provider = getProviderFromModel(model);
    console.log("Chat request:", { model, provider, messageLength: message.length });

    // Get API key from admin_settings
    const { data: setting, error: settingError } = await supabaseAdmin
      .from("admin_settings")
      .select("api_key")
      .eq("provider", provider)
      .single();

    console.log("API Key Fetch Debug:", {
      provider,
      settingError: settingError ? {
        message: settingError.message,
        code: settingError.code,
        details: settingError.details
      } : null,
      hasSetting: !!setting,
      hasApiKey: !!setting?.api_key
    });

    if (settingError) {
      console.error("Error fetching API key:", settingError);
      return res.status(400).json({ 
        error: `Nepodařilo se načíst API klíč pro ${provider}. Zkontrolujte nastavení v admin panelu.` 
      });
    }

    if (!setting?.api_key) {
      console.error("API key not found for provider:", provider);
      return res.status(400).json({ 
        error: `API klíč pro ${provider} není nastaven. Přidejte ho v admin panelu (Nastavení → API klíče).` 
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
          return res.status(400).json({ error: `Nepodporovaný AI model: ${model}` });
      }

      console.log("AI response received, length:", response.length);
      return res.status(200).json({ response });
      
    } catch (apiError: any) {
      console.error("AI API Error:", {
        provider,
        model,
        error: apiError.message,
        stack: apiError.stack
      });
      return res.status(500).json({ 
        error: `Chyba při komunikaci s ${provider}: ${apiError.message}` 
      });
    }
    
  } catch (error: any) {
    console.error("Unhandled Chat API Error:", {
      message: error.message,
      stack: error.stack,
      error: error
    });
    return res.status(500).json({ 
      error: "Neočekávaná chyba serveru. Zkontrolujte logy." 
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
  try {
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
      const errorText = await response.text();
      let errorMessage;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Nepodařilo se získat odpověď.";
  } catch (error: any) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

async function callAnthropic(message: string, model: string, apiKey: string): Promise<string> {
  try {
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
      const errorText = await response.text();
      let errorMessage;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.content[0]?.text || "Nepodařilo se získat odpověď.";
  } catch (error: any) {
    throw new Error(`Anthropic API error: ${error.message}`);
  }
}

async function callGoogle(message: string, model: string, apiKey: string): Promise<string> {
  try {
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
      const errorText = await response.text();
      let errorMessage;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || "Nepodařilo se získat odpověď.";
  } catch (error: any) {
    throw new Error(`Google AI API error: ${error.message}`);
  }
}

async function callMistral(message: string, model: string, apiKey: string): Promise<string> {
  try {
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
      const errorText = await response.text();
      let errorMessage;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Nepodařilo se získat odpověď.";
  } catch (error: any) {
    throw new Error(`Mistral API error: ${error.message}`);
  }
}

async function callXAI(message: string, model: string, apiKey: string): Promise<string> {
  try {
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
      const errorText = await response.text();
      let errorMessage;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Nepodařilo se získat odpověď.";
  } catch (error: any) {
    throw new Error(`X AI API error: ${error.message}`);
  }
}
