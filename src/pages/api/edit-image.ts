import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { 
      originalImageUrl, 
      originalImageId,
      editType, 
      prompt, 
      maskData,
      model = "openai"
    } = req.body;

    if (!originalImageUrl || !editType) {
      return res.status(400).json({ 
        error: "Missing required fields: originalImageUrl, editType" 
      });
    }

    // Check credits
    const { data: creditsData, error: creditsError } = await supabase.rpc(
      "get_user_credits",
      { user_id: user.id } as any
    );

    if (creditsError) {
      return res.status(500).json({ error: "Failed to check credits" });
    }

    if (creditsData < 3) {
      return res.status(402).json({ error: "Insufficient credits. Image editing costs 3 credits." });
    }

    let editedImageUrl = "";

    // Execute edit based on type and model
    if (model === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({ apiKey });

      if (editType === "variation") {
        // Download original image
        const imageResponse = await fetch(originalImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });

        const response = await openai.images.createVariation({
          image: imageFile,
          n: 1,
          size: "1024x1024",
        });

        editedImageUrl = response.data[0].url || "";
      } else if (editType === "inpaint" && prompt && maskData) {
        // For inpainting, we need both image and mask
        const imageResponse = await fetch(originalImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });

        // Convert base64 mask to file
        const maskBuffer = Buffer.from(maskData.split(",")[1], "base64");
        const maskFile = new File([maskBuffer], "mask.png", { type: "image/png" });

        const response = await openai.images.edit({
          image: imageFile,
          mask: maskFile,
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });

        editedImageUrl = response.data[0].url || "";
      } else {
        return res.status(400).json({ 
          error: `Edit type '${editType}' not supported with OpenAI or missing required parameters` 
        });
      }
    } else if (model === "stability") {
      const apiKey = process.env.STABILITY_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Stability AI API key not configured" });
      }

      // Stability AI implementation for inpainting
      if (editType === "inpaint" && prompt) {
        const imageResponse = await fetch(originalImageUrl);
        const imageBlob = await imageResponse.blob();

        const formData = new FormData();
        formData.append("init_image", imageBlob);
        formData.append("text_prompts[0][text]", prompt);
        formData.append("text_prompts[0][weight]", "1");
        
        if (maskData) {
          const maskBuffer = Buffer.from(maskData.split(",")[1], "base64");
          const maskBlob = new Blob([maskBuffer], { type: "image/png" });
          formData.append("mask_image", maskBlob);
        }

        const response = await fetch(
          "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image/masking",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Stability AI error: ${errorData}`);
        }

        const result = await response.json();
        const base64Image = result.artifacts[0].base64;
        editedImageUrl = `data:image/png;base64,${base64Image}`;
      } else {
        return res.status(400).json({ 
          error: `Edit type '${editType}' not supported with Stability AI` 
        });
      }
    }

    if (!editedImageUrl) {
      return res.status(500).json({ error: "Failed to generate edited image" });
    }

    // Save to database
    const { data: edit, error: dbError } = await supabase
      .from("image_edits")
      .insert({
        user_id: user.id,
        original_image_id: originalImageId || null,
        original_image_url: originalImageUrl,
        edited_image_url: editedImageUrl,
        edit_type: editType,
        prompt: prompt || null,
        mask_data: maskData || null,
        model_used: model,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Failed to save edit" });
    }

    // Deduct credits
    await supabase.rpc("deduct_credits", {
      user_id: user.id,
      amount: 3,
      description: `Image editing: ${editType}`,
    } as any);

    return res.status(200).json({ 
      edit,
      message: "Image edited successfully" 
    });
  } catch (error: any) {
    console.error("Image edit error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to edit image" 
    });
  }
}