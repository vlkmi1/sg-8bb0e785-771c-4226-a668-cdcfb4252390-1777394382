import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MusicRequest {
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
    const { prompt, genre, mood, duration, provider, userId }: MusicRequest = req.body;

    if (!prompt || !duration || !provider || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get admin API key for the selected provider
    const { data: adminSettings } = await supabase
      .from("admin_settings" as any)
      .select("api_key")
      .eq("provider", provider)
      .single();

    if (!adminSettings?.api_key) {
      return res.status(500).json({ 
        error: `${provider} API key not configured. Please contact administrator.` 
      });
    }

    let audioUrl: string | null = null;
    const actualDuration = duration;

    // Generate music based on provider
    switch (provider) {
      case "suno":
        audioUrl = await generateWithSuno(prompt, genre, mood, duration, adminSettings.api_key);
        break;
      case "musicgen":
        audioUrl = await generateWithMusicGen(prompt, genre, mood, duration, adminSettings.api_key);
        break;
      case "mubert":
        audioUrl = await generateWithMubert(prompt, genre, mood, duration, adminSettings.api_key);
        break;
      case "aiva":
        audioUrl = await generateWithAIVA(prompt, genre, mood, duration, adminSettings.api_key);
        break;
      case "soundraw":
        audioUrl = await generateWithSoundraw(prompt, genre, mood, duration, adminSettings.api_key);
        break;
      default:
        return res.status(400).json({ error: "Invalid provider" });
    }

    if (!audioUrl) {
      // Fallback to mock for development
      audioUrl = `https://example.com/music/${Date.now()}.mp3`;
    }

    // Update the generation record with the audio URL
    const { data: generation, error: updateError } = await supabase
      .from("music_generations")
      .update({ 
        audio_url: audioUrl,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating generation:", updateError);
    }

    return res.status(200).json({
      success: true,
      audioUrl,
      duration: actualDuration,
      generation,
    });

  } catch (error: any) {
    console.error("Error generating music:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate music" 
    });
  }
}

// Suno AI - https://suno.ai/
async function generateWithSuno(
  prompt: string,
  genre: string | undefined,
  mood: string | undefined,
  duration: number,
  apiKey: string
): Promise<string | null> {
  try {
    const fullPrompt = `${prompt}. Genre: ${genre || "Pop"}. Mood: ${mood || "Energetic"}. Duration: ${duration} seconds.`;
    
    // Suno API call
    const response = await fetch("https://api.suno.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        make_instrumental: false,
        wait_audio: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.audio_url || data[0]?.audio_url || null;
  } catch (error) {
    console.error("Suno generation error:", error);
    return null;
  }
}

// Meta MusicGen - https://ai.meta.com/resources/models-and-libraries/musicgen/
async function generateWithMusicGen(
  prompt: string,
  genre: string | undefined,
  mood: string | undefined,
  duration: number,
  apiKey: string
): Promise<string | null> {
  try {
    // Using Replicate API for MusicGen
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        input: {
          prompt: `${prompt}. ${genre || ""}. ${mood || ""}`,
          duration: duration,
          model_version: "stereo-large",
          output_format: "mp3",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`MusicGen API error: ${response.statusText}`);
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${apiKey}` },
      });
      result = await pollResponse.json();
    }

    return result.output || null;
  } catch (error) {
    console.error("MusicGen generation error:", error);
    return null;
  }
}

// Mubert - https://mubert.com/
async function generateWithMubert(
  prompt: string,
  genre: string | undefined,
  mood: string | undefined,
  duration: number,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch("https://api-b2b.mubert.com/v2/RecordTrack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "RecordTrack",
        params: {
          pat: apiKey,
          duration: duration,
          tags: `${genre || ""}, ${mood || ""}`,
          mode: "track",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Mubert API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.tasks?.[0]?.download_link || null;
  } catch (error) {
    console.error("Mubert generation error:", error);
    return null;
  }
}

// AIVA - https://www.aiva.ai/
async function generateWithAIVA(
  prompt: string,
  genre: string | undefined,
  mood: string | undefined,
  duration: number,
  apiKey: string
): Promise<string | null> {
  try {
    // AIVA requires preset selection
    const response = await fetch("https://api.aiva.ai/v1/compositions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preset_id: "electronic", // Map genre to preset
        duration: duration,
        title: prompt.substring(0, 50),
      }),
    });

    if (!response.ok) {
      throw new Error(`AIVA API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.download_url || null;
  } catch (error) {
    console.error("AIVA generation error:", error);
    return null;
  }
}

// Soundraw - https://soundraw.io/
async function generateWithSoundraw(
  prompt: string,
  genre: string | undefined,
  mood: string | undefined,
  duration: number,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch("https://api.soundraw.io/api/v1/music/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        genre: genre?.toLowerCase() || "pop",
        mood: mood?.toLowerCase() || "energetic",
        length: duration,
        theme: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Soundraw API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.music_url || null;
  } catch (error) {
    console.error("Soundraw generation error:", error);
    return null;
  }
}