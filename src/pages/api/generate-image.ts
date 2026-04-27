import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import OpenAI from "openai";

type GenerateImageRequest = {
  prompt: string;
  provider: "openai" | "stability" | "midjourney";
  size?: string;
  model?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, provider, size = "1024x1024", model } = req.body as GenerateImageRequest;

    // Get auth token from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    // Get API key for provider
    const { data: apiKeyData } = await supabase
      .from("api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    if (!apiKeyData) {
      return res.status(400).json({ 
        error: `No API key found for ${provider}. Please add your API key in settings.` 
      });
    }

    let imageUrl: string;

    // Generate image based on provider
    if (provider === "openai") {
      const openai = new OpenAI({ apiKey: apiKeyData.encrypted_key });
      
      const response = await openai.images.generate({
        model: model || "dall-e-3",
        prompt,
        n: 1,
        size: size as "1024x1024" | "1024x1792" | "1792x1024",
      });

      imageUrl = response.data[0].url!;
    } else if (provider === "stability") {
      // Stability AI implementation
      const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeyData.encrypted_key}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }),
      });

      if (!response.ok) {
        throw new Error(`Stability AI error: ${response.statusText}`);
      }

      const data = await response.json();
      // Stability returns base64 image - need to upload to Supabase storage
      const base64Image = data.artifacts[0].base64;
      
      // Upload to Supabase storage
      const fileName = `${user.id}/${Date.now()}.png`;
      const imageBuffer = Buffer.from(base64Image, "base64");
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("generated-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    } else {
      return res.status(400).json({ error: "Provider not supported yet" });
    }

    // Save to database
    const { data: savedImage, error: saveError } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        prompt,
        image_url: imageUrl,
        provider,
        model_name: model || provider,
        size,
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    // Deduct credits
    await supabase.rpc("deduct_credits", {
      user_id: user.id,
      amount: 2,
      description: `Image generation: ${provider}`,
    });

    return res.status(200).json(savedImage);
  } catch (error) {
    console.error("Image generation error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}