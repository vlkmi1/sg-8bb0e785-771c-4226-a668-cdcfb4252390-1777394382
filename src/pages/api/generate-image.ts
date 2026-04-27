import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/server";
import OpenAI from "openai";

type GenerateImageRequest = {
  prompt: string;
  provider: "openai" | "stability" | "midjourney";
  size?: string;
  model?: string;
};

// Increase timeout to 60 seconds for AI image generation
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
    responseLimit: false,
    externalResolver: true,
  },
  maxDuration: 60, // 60 seconds timeout
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

    console.log(`[Image Gen] Starting generation for ${provider}...`);
    console.log(`[Image Gen] Service role key available:`, !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Get auth token from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error("[Image Gen] No authorization header");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("[Image Gen] Auth error:", authError);
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`[Image Gen] User authenticated: ${user.email}`);

    // Check credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 2) {
      console.error(`[Image Gen] Insufficient credits: ${profile?.credits || 0}`);
      return res.status(402).json({ error: "Insufficient credits" });
    }

    console.log(`[Image Gen] Credits OK: ${profile.credits}`);

    // Try to get user's personal API key first
    let { data: apiKeyData } = await supabase
      .from("api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    // Fallback to admin settings if user doesn't have personal key
    if (!apiKeyData) {
      console.log(`[Image Gen] No personal key, checking admin settings...`);
      const { data: adminKey } = await supabase
        .from("admin_settings")
        .select("api_key")
        .eq("provider", provider)
        .eq("is_active", true)
        .single();

      if (!adminKey) {
        console.error(`[Image Gen] No API key found for ${provider}`);
        return res.status(400).json({ 
          error: `No API key found for ${provider}. Please add your API key in settings or contact admin.` 
        });
      }

      console.log(`[Image Gen] Using admin key for ${provider}`);
      apiKeyData = { encrypted_key: adminKey.api_key };
    }

    let imageUrl: string;

    // Generate image based on provider
    if (provider === "openai") {
      console.log(`[Image Gen] Calling OpenAI DALL-E...`);
      const openai = new OpenAI({ apiKey: apiKeyData.encrypted_key });
      
      const response = await openai.images.generate({
        model: model || "dall-e-3",
        prompt,
        n: 1,
        size: size as "1024x1024" | "1024x1792" | "1792x1024",
      });

      imageUrl = response.data[0].url!;
      console.log(`[Image Gen] OpenAI success: ${imageUrl.substring(0, 50)}...`);
    } else if (provider === "stability") {
      console.log(`[Image Gen] Calling Stability AI...`);
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
        const errorText = await response.text();
        console.error(`[Image Gen] Stability AI error (${response.status}): ${errorText}`);
        throw new Error(`Stability AI error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[Image Gen] Stability AI response received, uploading to storage...`);
      
      // Stability returns base64 image - need to upload to Supabase storage
      const base64Image = data.artifacts[0].base64;
      
      // Upload to Supabase storage using admin client (bypasses RLS)
      const fileName = `${user.id}/${Date.now()}.png`;
      const imageBuffer = Buffer.from(base64Image, "base64");
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from("generated-images")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
        });

      if (uploadError) {
        console.error(`[Image Gen] Storage upload error:`, uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("generated-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
      console.log(`[Image Gen] Uploaded to storage: ${publicUrl}`);
    } else {
      console.error(`[Image Gen] Unsupported provider: ${provider}`);
      return res.status(400).json({ error: "Provider not supported yet" });
    }

    console.log(`[Image Gen] Saving to database...`);

    // Save to database using admin client (bypasses RLS)
    const { data: savedImage, error: saveError } = await supabaseAdmin
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
      console.error(`[Image Gen] DB save error:`, saveError);
      console.error(`[Image Gen] Full error details:`, JSON.stringify(saveError, null, 2));
      throw saveError;
    }

    console.log(`[Image Gen] Deducting credits...`);

    // Deduct credits using admin client
    await supabaseAdmin.rpc("deduct_credits", {
      user_id: user.id,
      amount: 2,
      description: `Image generation: ${provider}`,
    });

    console.log(`[Image Gen] Success! Image ID: ${savedImage.id}`);

    return res.status(200).json(savedImage);
  } catch (error) {
    console.error("[Image Gen] Fatal error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}