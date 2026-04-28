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

    if (!assistantId || !userMessage || !userId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Get assistant details
    const { data: assistant, error: assistantError } = await supabase
      .from("assistants")
      .select("*")
      .eq("id", assistantId)
      .single();

    if (assistantError || !assistant) {
      return res.status(404).json({ error: "Assistant not found" });
    }

    // Get conversation history
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("messages")
      .eq("assistant_id", assistantId)
      .eq("user_id", userId)
      .single();

    const messages = (conversation?.messages as any[]) || [];
    const conversationHistory = messages.slice(-10); // Last 10 messages for context

    // Determine which API to use based on model
    let response = "";
    const model = assistant.model || "gpt-4";

    if (model.startsWith("gpt-")) {
      response = await callOpenAI(assistant, conversationHistory, userMessage);
    } else if (model.startsWith("claude-")) {
      response = await callAnthropic(assistant, conversationHistory, userMessage);
    } else if (model.startsWith("gemini-")) {
      response = await callGoogle(assistant, conversationHistory, userMessage);
    } else if (model.startsWith("mistral-")) {
      response = await callMistral(assistant, conversationHistory, userMessage);
    } else {
      // Fallback to OpenAI
      response = await callOpenAI(assistant, conversationHistory, userMessage);
    }

    return res.status(200).json({ response });
  } catch (error: any) {
    console.error("Assistant chat error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate response" });
  }
}

async function callOpenAI(assistant: any, history: any[], userMessage: string): Promise<string> {
  // Get admin API key
  const { data: adminKey } = await supabase
    .from("admin_settings")
    .select("api_key")
    .eq("provider", "openai")
    .single();

  if (!adminKey?.api_key) {
    throw new Error("OpenAI API key not configured");
  }

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
      "Authorization": `Bearer ${adminKey.api_key}`,
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
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(assistant: any, history: any[], userMessage: string): Promise<string> {
  const { data: adminKey } = await supabase
    .from("admin_settings")
    .select("api_key")
    .eq("provider", "anthropic")
    .single();

  if (!adminKey?.api_key) {
    throw new Error("Anthropic API key not configured");
  }

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
      "x-api-key": adminKey.api_key,
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
    throw new Error(error.error?.message || "Anthropic API error");
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(assistant: any, history: any[], userMessage: string): Promise<string> {
  const { data: adminKey } = await supabase
    .from("admin_settings")
    .select("api_key")
    .eq("provider", "google")
    .single();

  if (!adminKey?.api_key) {
    throw new Error("Google API key not configured");
  }

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
    `https://generativelanguage.googleapis.com/v1beta/models/${assistant.model}:generateContent?key=${adminKey.api_key}`,
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
    throw new Error(error.error?.message || "Google API error");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callMistral(assistant: any, history: any[], userMessage: string): Promise<string> {
  const { data: adminKey } = await supabase
    .from("admin_settings")
    .select("api_key")
    .eq("provider", "mistral")
    .single();

  if (!adminKey?.api_key) {
    throw new Error("Mistral API key not configured");
  }

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
      "Authorization": `Bearer ${adminKey.api_key}`,
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
    throw new Error(error.error?.message || "Mistral API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}