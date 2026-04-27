import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAdminApiKey(provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("api_key")
    .eq("provider", provider)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data.api_key;
}

async function deductCredits(userId: string, amount: number): Promise<boolean> {
  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_description: "Document summary generation"
  });

  return !error && data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, level, model, userId } = req.body;

  if (!text || !level || !model || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Deduct credits first
    const credited = await deductCredits(userId, 2);
    if (!credited) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    let systemPrompt = "";
    switch (level) {
      case "short":
        systemPrompt = "Shrň následující text do 1-2 odstavců. Zaměř se pouze na hlavní myšlenky.";
        break;
      case "medium":
        systemPrompt = "Vytvoř střední shrnutí textu v 5-7 odstavcích. Zahrň hlavní body a důležité detaily.";
        break;
      case "detailed":
        systemPrompt = "Vytvoř detailní shrnutí s bullet points. Strukturuj ho do sekcí s hlavními myšlenkami a podporujícími body.";
        break;
    }

    let summary = "";

    if (model === "gpt-4" || model === "gpt-3.5-turbo") {
      const apiKey = await getAdminApiKey("openai");
      if (!apiKey) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "OpenAI API error");
      }

      summary = data.choices[0].message.content;

    } else if (model.startsWith("claude")) {
      const apiKey = await getAdminApiKey("anthropic");
      if (!apiKey) {
        return res.status(500).json({ error: "Anthropic API key not configured" });
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 2048,
          messages: [
            { 
              role: "user", 
              content: `${systemPrompt}\n\n${text}` 
            }
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Anthropic API error");
      }

      summary = data.content[0].text;

    } else if (model === "gemini-pro") {
      const apiKey = await getAdminApiKey("google");
      if (!apiKey) {
        return res.status(500).json({ error: "Google API key not configured" });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ text: `${systemPrompt}\n\n${text}` }] 
            }],
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Google API error");
      }

      summary = data.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({ summary });

  } catch (error: any) {
    console.error("Error generating summary:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate summary" 
    });
  }
}