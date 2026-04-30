import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

// Whisper API for transcription
const OPENAI_API_URL = "https://api.openai.com/v1/audio/transcriptions";

// AssemblyAI for video transcription (alternative)
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2/transcript";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });

    const [fields, files] = await form.parse(req);
    
    let videoUrl: string | undefined;
    let videoFile: formidable.File | undefined;

    if (fields.videoUrl && fields.videoUrl[0]) {
      videoUrl = fields.videoUrl[0];
    }

    if (files.video && files.video[0]) {
      videoFile = files.video[0];
    }

    if (!videoUrl && !videoFile) {
      return res.status(400).json({ error: "Video URL or file required" });
    }

    let script = "";

    // Use OpenAI Whisper if API key is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && videoFile) {
      script = await transcribeWithWhisper(videoFile.filepath, openaiKey);
    } 
    // Use AssemblyAI as alternative
    else if (process.env.ASSEMBLYAI_API_KEY) {
      if (videoUrl) {
        script = await transcribeWithAssemblyAI(videoUrl, process.env.ASSEMBLYAI_API_KEY);
      } else if (videoFile) {
        // Upload to temporary storage and get URL
        const tempUrl = await uploadToTempStorage(videoFile.filepath);
        script = await transcribeWithAssemblyAI(tempUrl, process.env.ASSEMBLYAI_API_KEY);
      }
    } 
    // Fallback: Extract audio and use speech-to-text
    else {
      return res.status(400).json({ 
        error: "No transcription API key configured. Add OPENAI_API_KEY or ASSEMBLYAI_API_KEY to environment variables." 
      });
    }

    // Clean up temporary file
    if (videoFile) {
      fs.unlinkSync(videoFile.filepath);
    }

    return res.status(200).json({
      success: true,
      script,
      wordCount: script.split(/\s+/).length,
    });

  } catch (error: any) {
    console.error("Error extracting video script:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to extract script from video" 
    });
  }
}

async function transcribeWithWhisper(
  audioPath: string,
  apiKey: string
): Promise<string> {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(audioPath);
  const blob = new Blob([fileBuffer]);
  
  formData.append("file", blob, "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("language", "cs");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Whisper API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}

async function transcribeWithAssemblyAI(
  videoUrl: string,
  apiKey: string
): Promise<string> {
  // Step 1: Submit video for transcription
  const submitResponse = await fetch(ASSEMBLYAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": apiKey,
    },
    body: JSON.stringify({
      audio_url: videoUrl,
      language_code: "cs",
    }),
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.json();
    throw new Error(`AssemblyAI error: ${error.error || submitResponse.statusText}`);
  }

  const { id } = await submitResponse.json();

  // Step 2: Poll for completion
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(`${ASSEMBLYAI_API_URL}/${id}`, {
      headers: {
        "Authorization": apiKey,
      },
    });

    const statusData = await statusResponse.json();
    
    if (statusData.status === "completed") {
      return statusData.text;
    } else if (statusData.status === "error") {
      throw new Error(`Transcription failed: ${statusData.error}`);
    }
    
    attempts++;
  }

  throw new Error("Transcription timeout");
}

async function uploadToTempStorage(filePath: string): Promise<string> {
  // In production, upload to S3/Supabase Storage
  // For now, return a placeholder
  return `https://temp-storage.example.com/${Date.now()}.mp4`;
}