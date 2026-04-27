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
    p_description: "Ad generation"
  });

  return !error && data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productDescription, targetAudience, platform, adFormat, model, userId } = req.body;

  if (!productDescription || !platform || !adFormat || !model || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Deduct credits first
    const credited = await deductCredits(userId, 3);
    if (!credited) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    const platformSpecs: Record<string, any> = {
      facebook: { headlineMax: 40, descMax: 125 },
      instagram: { headlineMax: 30, descMax: 2200 },
      linkedin: { headlineMax: 70, descMax: 600 },
      google: { headlineMax: 30, descMax: 90 },
      tiktok: { headlineMax: 100, descMax: 2200 },
    };

    const specs = platformSpecs[platform] || platformSpecs.facebook;

    const systemPrompt = `Jsi expert na tvorbu reklamního copywritingu pro ${platform.toUpperCase()}.

Vytvořit kompletní reklamu pro následující produkt/službu:
${productDescription}

${targetAudience ? `Cílová skupina: ${targetAudience}` : ""}

Formát reklamy: ${adFormat}

Požadavky:
1. Headline (max ${specs.headlineMax} znaků) - zachycující, jasný, action-oriented
2. Description (max ${specs.descMax} znaků) - přesvědčivý text s benefity
3. Call-to-Action (CTA) - silná výzva k akci
4. Hashtags - 5-8 relevantních hashtagů pro ${platform}
5. Image Suggestions - 3 konkrétní návrhy na vizuály/obrázky

Odpověz VÝHRADNĚ ve formátu JSON:
{
  "headline": "...",
  "description": "...",
  "cta": "...",
  "hashtags": "#hashtag1 #hashtag2 ...",
  "imageSuggestions": "1. ... 2. ... 3. ..."
}`;

    let adContent: any = {};

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
            { role: "system", content: systemPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "OpenAI API error");
      }

      adContent = JSON.parse(data.choices[0].message.content);

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
            { role: "user", content: systemPrompt }
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Anthropic API error");
      }

      adContent = JSON.parse(data.content[0].text);
    }

    return res.status(200).json(adContent);

  } catch (error: any) {
    console.error("Error generating ad:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate ad" 
    });
  }
}