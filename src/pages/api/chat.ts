import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Create regular client with anon key (admin_settings table now allows public SELECT)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type immediately
  res.setHeader('Content-Type', 'application/json');

  console.log("[chat] Request received:", {
    method: req.method,
    body: req.body ? {
      hasMessage: !!req.body.message,
      hasModel: !!req.body.model,
      model: req.body.model,
      messageLength: req.body.message?.length
    } : null
  });

  try {
    if (req.method !== "POST") {
      console.error("[chat] Invalid method:", req.method);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, model, conversationId } = req.body;

    if (!message || !model) {
      console.error("[chat] Missing required fields:", { hasMessage: !!message, hasModel: !!model });
      return res.status(400).json({ error: "Chybí povinná pole (message nebo model)" });
    }

    // Determine provider from model name
    const provider = getProviderFromModel(model);
    console.log("[chat] Provider determined:", provider, "for model:", model);

    // Get API key from admin_settings
    console.log("[chat] Fetching API key for provider:", provider);
    
    const { data: setting, error: settingError } = await supabase
      .from("admin_settings")
      .select("api_key")
      .eq("provider", provider)
      .single();

    console.log("[chat] API Key fetch result:", {
      provider,
      hasSetting: !!setting,
      hasApiKey: !!setting?.api_key,
      apiKeyPrefix: setting?.api_key?.substring(0, 10) + "...",
      error: settingError ? {
        message: settingError.message,
        code: settingError.code,
        details: settingError.details
      } : null
    });

    if (settingError) {
      console.error("[chat] Error fetching API key:", settingError);
      return res.status(400).json({ 
        error: `Nepodařilo se načíst API klíč pro ${provider}. Zkontrolujte nastavení v admin panelu.`,
        details: settingError.message
      });
    }

    if (!setting?.api_key) {
      console.error("[chat] API key not found for provider:", provider);
      return res.status(400).json({ 
        error: `API klíč pro ${provider} není nastaven. Přidejte ho v admin panelu (Nastavení → API klíče).` 
      });
    }

    const apiKey = setting.api_key;
    console.log("[chat] API key retrieved successfully, length:", apiKey.length);

    // Call appropriate AI API based on provider
    let response: string;
    
    try {
      console.log("[chat] Calling AI provider:", provider);
      
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
          console.error("[chat] Unsupported provider:", provider);
          return res.status(400).json({ error: `Nepodporovaný AI model: ${model}` });
      }

      console.log("[chat] AI response received, length:", response.length);
      return res.status(200).json({ response });
      
    } catch (apiError: any) {
      console.error("[chat] AI API Error:", {
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
    console.error("[chat] Unhandled error:", {
      message: error.message,
      stack: error.stack
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
    const currentDate = new Date().toLocaleDateString('cs-CZ', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: "system", 
            content: `Jsi užitečný AI asistent. Aktuální datum je ${currentDate}. Vždy používej aktuální informace a datum.` 
          },
          { role: "user", content: message }
        ],
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
    const currentDate = new Date().toLocaleDateString('cs-CZ', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
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
        system: `Jsi užitečný AI asistent. Aktuální datum je ${currentDate}. Vždy používej aktuální informace a datum.`,
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
    const currentDate = new Date().toLocaleDateString('cs-CZ', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const systemPrompt = `Jsi užitečný AI asistent. Aktuální datum je ${currentDate}. Vždy používej aktuální informace a datum.`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [
              { text: systemPrompt },
              { text: message }
            ] 
          }],
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
    const currentDate = new Date().toLocaleDateString('cs-CZ', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: "system", 
            content: `Jsi užitečný AI asistent. Aktuální datum je ${currentDate}. Vždy používej aktuální informace a datum.` 
          },
          { role: "user", content: message }
        ],
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
    const currentDate = new Date().toLocaleDateString('cs-CZ', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: "system", 
            content: `Jsi užitečný AI asistent. Aktuální datum je ${currentDate}. Vždy používej aktuální informace a datum.` 
          },
          { role: "user", content: message }
        ],
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
