import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter" | "youtube" | "tiktok";

const PLATFORM_LIMITS = {
  facebook: { maxChars: 63206, hashtagsRecommended: 3 },
  instagram: { maxChars: 2200, hashtagsRecommended: 10 },
  linkedin: { maxChars: 3000, hashtagsRecommended: 5 },
  twitter: { maxChars: 280, hashtagsRecommended: 2 },
  youtube: { maxChars: 5000, hashtagsRecommended: 3 },
  tiktok: { maxChars: 2200, hashtagsRecommended: 5 },
};

const PLATFORM_PROMPTS = {
  facebook: "Vytvoř poutavý Facebook post s emocemi a komunitním přístupem. Používej storytelling a zahrň call-to-action.",
  instagram: "Vytvoř estetický Instagram post s vizuálním myšlením. Zahrň emoji, newlines pro čitelnost a hashtags na konci.",
  linkedin: "Vytvoř profesionální LinkedIn post s business hodnotou. Používej odstavce, buď informativní a založený na insights.",
  twitter: "Vytvoř stručný, vtipný tweet. Jdi rovnou k věci, používej hashtags organicky v textu. Max 280 znaků!",
  youtube: "Vytvoř popisný YouTube text pro komunitu. Zahrň timestamps ideje, odkazy a call-to-action pro like/subscribe.",
  tiktok: "Vytvoř energický TikTok popis. Používej trendy slang, emoji, hashtags a výzvu k interakci.",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, platform, userId } = req.body;

    if (!topic || !platform || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get admin API key
    const { data: setting, error: settingError } = await supabase
      .from("admin_settings")
      .select("api_key")
      .eq("provider", "openai")
      .single();

    if (settingError || !setting?.api_key) {
      return res.status(400).json({ 
        error: "OpenAI API klíč není nastaven. Přidejte ho v admin panelu." 
      });
    }

    const apiKey = setting.api_key;
    const platformLimit = PLATFORM_LIMITS[platform as SocialPlatform];
    const platformPrompt = PLATFORM_PROMPTS[platform as SocialPlatform];

    // Generate content using OpenAI
    const systemPrompt = `${platformPrompt}

DŮLEŽITÉ LIMITY:
- Maximum znaků: ${platformLimit.maxChars}
- Doporučené hashtags: ${platformLimit.hashtagsRecommended}

Formátování:
- Používej prázdné řádky pro odstavce
- Hashtags obvykle na konci (kromě Twitter kde mohou být v textu)
- Emoji pro vizuální přitažlivost (kde je to vhodné)
- Clear call-to-action

Vrať POUZE samotný text příspěvku, bez úvodu jako "Zde je post..." apod.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Téma: ${topic}` }
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    return res.status(200).json({ content });

  } catch (error: any) {
    console.error("Social post generation error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate social post" 
    });
  }
}