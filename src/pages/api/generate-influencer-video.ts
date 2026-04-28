import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface InfluencerVideoRequest {
  influencerId: string;
  script: string;
  voiceType: string;
  personality: string;
}

// D-ID API configuration
const DID_API_URL = "https://api.d-id.com/talks";
const DID_API_KEY = process.env.DID_API_KEY;

// HeyGen API configuration (alternative)
const HEYGEN_API_URL = "https://api.heygen.com/v1/video.generate";
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

// ElevenLabs for voice generation
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Voice mapping for ElevenLabs
const VOICE_MAPPING: Record<string, string> = {
  neutral: "21m00Tcm4TlvDq8ikWAM", // Rachel
  energetic: "pNInz6obpgDQGcFmaJgB", // Adam
  calm: "EXAVITQu4vr4xnSDxMaL", // Bella
  professional: "VR6AewLTigWG4xSOukaG", // Arnold
  friendly: "jsCqWAovK2LkecY7zXl4", // Freya
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { influencerId, script, voiceType, personality } = req.body as InfluencerVideoRequest;

    if (!influencerId || !script) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check credits (video generation costs 10 credits)
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 10) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    // Fetch influencer details
    const { data: influencer, error: influencerError } = await supabase
      .from("ai_influencers")
      .select("*")
      .eq("id", influencerId)
      .single();

    if (influencerError || !influencer) {
      return res.status(404).json({ error: "Influencer not found" });
    }

    let videoUrl = "";
    let audioUrl = "";
    let duration = 0;

    // Choose API provider based on environment variables
    if (DID_API_KEY) {
      // Use D-ID for avatar video generation
      const didResult = await generateWithDID(script, voiceType, influencer.avatar_url);
      videoUrl = didResult.videoUrl;
      duration = didResult.duration;
    } else if (HEYGEN_API_KEY) {
      // Use HeyGen as alternative
      const heygenResult = await generateWithHeyGen(script, voiceType, personality);
      videoUrl = heygenResult.videoUrl;
      duration = heygenResult.duration;
    } else {
      // Fallback: Generate audio with ElevenLabs and use static avatar
      if (ELEVENLABS_API_KEY) {
        audioUrl = await generateVoiceWithElevenLabs(script, voiceType);
        duration = Math.ceil(script.split(" ").length / 2.5); // Estimate ~2.5 words/second
        // In production, you'd combine this with a static image to create video
        videoUrl = `https://example.com/static-avatar-videos/${influencerId}-${Date.now()}.mp4`;
      } else {
        // Complete fallback: mock video
        console.warn("No video generation API keys found. Using mock data.");
        videoUrl = `https://example.com/influencer-videos/${influencerId}-${Date.now()}.mp4`;
        duration = Math.ceil(script.split(" ").length / 2.5);
      }
    }

    // Save video to database
    const { data: video, error: videoError } = await supabase
      .from("influencer_videos")
      .insert({
        user_id: user.id,
        influencer_id: influencerId,
        script,
        video_url: videoUrl,
        audio_url: audioUrl,
        duration,
        status: "completed",
      })
      .select()
      .single();

    if (videoError) {
      throw new Error(`Failed to save video: ${videoError.message}`);
    }

    // Deduct credits
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - 10 })
      .eq("id", user.id);

    return res.status(200).json({
      success: true,
      video,
      creditsUsed: 10,
      remainingCredits: profile.credits - 10,
    });

  } catch (error: any) {
    console.error("Error generating influencer video:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate influencer video" 
    });
  }
}

// D-ID API integration
async function generateWithDID(
  script: string, 
  voiceType: string,
  avatarUrl?: string
): Promise<{ videoUrl: string; duration: number }> {
  if (!DID_API_KEY) {
    throw new Error("D-ID API key not configured");
  }

  // Step 1: Create talk
  const createResponse = await fetch(DID_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${DID_API_KEY}`,
    },
    body: JSON.stringify({
      script: {
        type: "text",
        input: script,
        provider: {
          type: "elevenlabs",
          voice_id: VOICE_MAPPING[voiceType] || VOICE_MAPPING.neutral,
        },
      },
      source_url: avatarUrl || "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg",
      config: {
        stitch: true,
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`D-ID API error: ${error.message || createResponse.statusText}`);
  }

  const createData = await createResponse.json();
  const talkId = createData.id;

  // Step 2: Poll for completion (max 60 seconds)
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const statusResponse = await fetch(`${DID_API_URL}/${talkId}`, {
      headers: {
        "Authorization": `Basic ${DID_API_KEY}`,
      },
    });

    const statusData = await statusResponse.json();
    
    if (statusData.status === "done") {
      return {
        videoUrl: statusData.result_url,
        duration: statusData.duration || 30,
      };
    } else if (statusData.status === "error") {
      throw new Error(`D-ID generation failed: ${statusData.error}`);
    }
    
    attempts++;
  }

  throw new Error("Video generation timeout");
}

// HeyGen API integration
async function generateWithHeyGen(
  script: string,
  voiceType: string,
  personality: string
): Promise<{ videoUrl: string; duration: number }> {
  if (!HEYGEN_API_KEY) {
    throw new Error("HeyGen API key not configured");
  }

  const response = await fetch(HEYGEN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": HEYGEN_API_KEY,
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: "avatar",
          avatar_id: "default", // Use HeyGen avatar ID
          avatar_style: personality,
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceType,
        },
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`HeyGen API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  
  // Poll for video completion
  const videoId = data.video_id;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResponse = await fetch(`${HEYGEN_API_URL}/${videoId}`, {
      headers: { "X-Api-Key": HEYGEN_API_KEY },
    });
    
    const statusData = await statusResponse.json();
    
    if (statusData.status === "completed") {
      return {
        videoUrl: statusData.video_url,
        duration: statusData.duration || 30,
      };
    } else if (statusData.status === "failed") {
      throw new Error("HeyGen video generation failed");
    }
    
    attempts++;
  }

  throw new Error("Video generation timeout");
}

// ElevenLabs voice generation
async function generateVoiceWithElevenLabs(
  text: string,
  voiceType: string
): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key not configured");
  }

  const voiceId = VOICE_MAPPING[voiceType] || VOICE_MAPPING.neutral;
  
  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ElevenLabs API error: ${error.message || response.statusText}`);
  }

  const audioBlob = await response.blob();
  // In production, upload this to Supabase Storage or S3
  const audioUrl = `https://example.com/audio/${Date.now()}.mp3`;
  
  return audioUrl;
}