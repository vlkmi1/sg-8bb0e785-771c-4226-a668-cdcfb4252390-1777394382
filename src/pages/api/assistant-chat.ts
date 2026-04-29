import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { assistantId, userMessage, userId } = req.body;

    console.log("[assistant-chat] Request:", { assistantId, userMessage: userMessage?.substring(0, 50), userId });

    if (!assistantId || !userMessage || !userId) {
      console.error("[assistant-chat] Missing parameters:", { assistantId: !!assistantId, userMessage: !!userMessage, userId: !!userId });
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Get assistant details
    const { data: assistant, error: assistantError } = await supabase
      .from("assistants")
      .select("*")
      .eq("id", assistantId)
      .single();

    if (assistantError || !assistant) {
      console.error("[assistant-chat] Assistant not found:", assistantError);
      return res.status(404).json({ error: "Assistant not found" });
    }

    console.log("[assistant-chat] Assistant loaded:", { name: assistant.name, model: assistant.model });

    // Get conversation history
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("messages")
      .eq("assistant_id", assistantId)
      .eq("user_id", userId)
      .single();

    const messages = (conversation?.messages as any[]) || [];
    const conversationHistory = messages.slice(-10); // Last 10 messages for context

    console.log("[assistant-chat] Conversation history length:", conversationHistory.length);

    // Determine which API to use based on model
    let response = "";
    const model = assistant.model || "gpt-4";
    const provider = model.startsWith("gpt-") ? "openai" 
                   : model.startsWith("claude-") ? "anthropic"
                   : model.startsWith("gemini-") ? "google"
                   : model.startsWith("mistral-") ? "mistral"
                   : "openai";

    console.log("[assistant-chat] Using provider:", provider, "model:", model);

    // Get admin API key for the provider
    const { data: adminSetting, error: keyError } = await supabase
      .from("admin_settings")
      .select("api_key")
      .eq("provider", provider)
      .single();

    if (keyError || !adminSetting?.api_key) {
      console.error("[assistant-chat] API key not found for provider:", provider, keyError);
      return res.status(400).json({ 
        error: `${provider} API key not configured. Please add it in Admin Settings.` 
      });
    }

    console.log("[assistant-chat] API key found for:", provider);

    // Generate response based on provider
    try {
      switch (provider) {
        case "openai":
          response = await callOpenAI(assistant, conversationHistory, userMessage, adminSetting.api_key);
          break;
        case "anthropic":
          response = await callAnthropic(assistant, conversationHistory, userMessage, adminSetting.api_key);
          break;
        case "google":
          response = await callGoogle(assistant, conversationHistory, userMessage, adminSetting.api_key);
          break;
        case "mistral":
          response = await callMistral(assistant, conversationHistory, userMessage, adminSetting.api_key);
          break;
        default:
          response = await callOpenAI(assistant, conversationHistory, userMessage, adminSetting.api_key);
      }
    } catch (apiError: any) {
      console.error("[assistant-chat] API call failed:", apiError);
      throw apiError;
    }

    console.log("[assistant-chat] Response generated, length:", response?.length);

    return res.status(200).json({ response });
  } catch (error: any) {
    console.error("[assistant-chat] Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate response" });
  }
}

async function callOpenAI(assistant: any, history: any[], userMessage: string, apiKey: string): Promise<string> {
  console.log("[OpenAI] Calling API...");
  
  const messages = [
    {
      role: "system",
      content: `${assistant.instructions}\n\nPersonality: ${assistant.personality || "Professional and helpful"}`,
    },
    ...history.map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: assistant.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[OpenAI] API error:", error);
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  console.log("[OpenAI] Response received");
  return data.choices[0].message.content;
}

async function callAnthropic(assistant: any, history: any[], userMessage: string, apiKey: string): Promise<string> {
  console.log("[Anthropic] Calling API...");
  
  const messages = [
    ...history.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: assistant.model,
      system: `${assistant.instructions}\n\nPersonality: ${assistant.personality || "Professional and helpful"}`,
      messages,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[Anthropic] API error:", error);
    throw new Error(error.error?.message || "Anthropic API error");
  }

  const data = await response.json();
  console.log("[Anthropic] Response received");
  return data.content[0].text;
}

async function callGoogle(assistant: any, history: any[], userMessage: string, apiKey: string): Promise<string> {
  console.log("[Google] Calling API...");
  
  const contents = [
    ...history.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const systemInstruction = `${assistant.instructions}\n\nPersonality: ${assistant.personality || "Professional and helpful"}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${assistant.model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("[Google] API error:", error);
    throw new Error(error.error?.message || "Google API error");
  }

  const data = await response.json();
  console.log("[Google] Response received");
  return data.candidates[0].content.parts[0].text;
}

async function callMistral(assistant: any, history: any[], userMessage: string, apiKey: string): Promise<string> {
  console.log("[Mistral] Calling API...");
  
  const messages = [
    {
      role: "system",
      content: `${assistant.instructions}\n\nPersonality: ${assistant.personality || "Professional and helpful"}`,
    },
    ...history.map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: assistant.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[Mistral] API error:", error);
    throw new Error(error.error?.message || "Mistral API error");
  }

  const data = await response.json();
  console.log("[Mistral] Response received");
  return data.choices[0].message.content;
}