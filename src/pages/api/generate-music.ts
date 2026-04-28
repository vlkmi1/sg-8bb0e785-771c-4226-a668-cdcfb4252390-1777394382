import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface MusicRequest {
  generationId?: string;
  prompt: string;
  genre?: string;
  mood?: string;
  duration: number;
  provider: "suno" | "musicgen" | "mubert" | "aiva" | "soundraw";
  userId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { generationId, prompt, genre, mood, duration, provider, userId } = req.body;

    if (!generationId || !prompt || !duration || !provider || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get admin API key for the provider
    const { data: adminSetting } = await supabaseAdmin
      .from("admin_settings")
      .select("api_key")
      .eq("provider", provider)
      .single();

    if (!adminSetting?.api_key) {
      // Update generation status to failed
      await supabaseAdmin
        .from("music_generations")
        .update({ 
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      return res.status(400).json({ 
        error: `${provider} API key not configured. Please add it in Admin Settings.` 
      });
    }

    let audioUrl: string | null = null;

    // Generate music based on provider
    switch (provider) {
      case "suno":
        audioUrl = await generateWithSuno(prompt, genre, mood, duration, adminSetting.api_key);
        break;
      case "musicgen":
        audioUrl = await generateWithMusicGen(prompt, genre, duration, adminSetting.api_key);
        break;
      case "mubert":
        audioUrl = await generateWithMubert(prompt, mood, duration, adminSetting.api_key);
        break;
      case "aiva":
        audioUrl = await generateWithAIVA(prompt, genre, duration, adminSetting.api_key);
        break;
      case "soundraw":
        audioUrl = await generateWithSoundraw(prompt, genre, mood, duration, adminSetting.api_key);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    if (!audioUrl) {
      // Update status to failed
      await supabaseAdmin
        .from("music_generations")
        .update({ 
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      return res.status(500).json({ error: "Failed to generate music" });
    }

    // Update generation with audio URL and completed status
    await supabaseAdmin
      .from("music_generations")
      .update({ 
        audio_url: audioUrl,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    // Track API usage
    await supabaseAdmin.from("api_usage_stats").insert({
      provider,
      request_type: "music_generation",
      request_count: 1,
      date: new Date().toISOString().split("T")[0],
    });

    return res.status(200).json({ 
      success: true,
      audioUrl,
      generationId,
    });
  } catch (error: any) {
    console.error("Music generation error:", error);
    
    // Update status to failed if we have generationId
    if (req.body.generationId) {
      const { error: updateError } = await supabaseAdmin
        .from("music_generations")
        .update({ 
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.body.generationId);
        
      if (updateError) {
        console.error("Failed to update status to failed:", updateError);
      }
    }

    return res.status(500).json({ 
      error: error.message || "Music generation failed" 
    });
  }
}

// Provider-specific generation functions
async function generateWithSuno(
  prompt: string,
  genre?: string,
  mood?: string,
  duration?: number,
  apiKey?: string
): Promise<string | null> {
  // Suno AI API implementation
  try {
    const response = await fetch("https://api.suno.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        genre,
        mood,
        duration,
      }),
    });

    if (!response.ok) throw new Error("Suno API error");

    const data = await response.json();
    return data.audio_url || null;
  } catch (error) {
    console.error("Suno generation error:", error);
    return null;
  }
}

async function generateWithMusicGen(
  prompt: string,
  genre?: string,
  duration?: number,
  apiKey?: string
): Promise<string | null> {
  // MusicGen (Replicate) API implementation
  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "meta/musicgen",
        input: {
          prompt: `${genre ? genre + " " : ""}${prompt}`,
          duration: duration || 30,
        },
      }),
    });

    if (!response.ok) throw new Error("MusicGen API error");

    const prediction = await response.json();
    
    // Poll for completion
    let audioUrl = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            "Authorization": `Token ${apiKey}`,
          },
        }
      );
      
      const status = await statusResponse.json();
      
      if (status.status === "succeeded") {
        audioUrl = status.output;
        break;
      } else if (status.status === "failed") {
        throw new Error("MusicGen generation failed");
      }
    }

    return audioUrl;
  } catch (error) {
    console.error("MusicGen generation error:", error);
    return null;
  }
}

async function generateWithMubert(
  prompt: string,
  mood?: string,
  duration?: number,
  apiKey?: string
): Promise<string | null> {
  try {
    const response = await fetch("https://api.mubert.com/v2/RecordTrack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "RecordTrack",
        params: {
          license: "basic",
          token: apiKey,
          mode: "track",
          duration: duration || 30,
          tags: mood,
          bitrate: 320,
        },
      }),
    });

    if (!response.ok) throw new Error("Mubert API error");

    const data = await response.json();
    return data.data?.tasks?.[0]?.download_link || null;
  } catch (error) {
    console.error("Mubert generation error:", error);
    return null;
  }
}

async function generateWithAIVA(
  prompt: string,
  genre?: string,
  duration?: number,
  apiKey?: string
): Promise<string | null> {
  try {
    const response = await fetch("https://api.aiva.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        style: genre,
        duration: duration || 30,
      }),
    });

    if (!response.ok) throw new Error("AIVA API error");

    const data = await response.json();
    return data.audio_url || null;
  } catch (error) {
    console.error("AIVA generation error:", error);
    return null;
  }
}

async function generateWithSoundraw(
  prompt: string,
  genre?: string,
  mood?: string,
  duration?: number,
  apiKey?: string
): Promise<string | null> {
  try {
    const response = await fetch("https://api.soundraw.io/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        genre,
        mood,
        length: duration || 30,
      }),
    });

    if (!response.ok) throw new Error("Soundraw API error");

    const data = await response.json();
    return data.audio_url || null;
  } catch (error) {
    console.error("Soundraw generation error:", error);
    return null;
  }
}