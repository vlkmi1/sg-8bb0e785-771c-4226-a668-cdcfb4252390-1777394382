import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audioData, provider, userId } = req.body;

    if (!audioData || !provider || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get admin API key for the provider
    const { data: setting, error: settingError } = await supabase
      .from("admin_settings")
      .select("api_key")
      .eq("provider", provider)
      .single();

    if (settingError || !setting?.api_key) {
      return res.status(400).json({ 
        error: `API klíč pro ${provider} není nastaven. Přidejte ho v admin panelu.` 
      });
    }

    const apiKey = setting.api_key;

    // Step 1: Transcribe audio using OpenAI Whisper
    const transcript = await transcribeAudio(audioData, apiKey);

    // Step 2: Generate AI response
    let responseText: string;
    if (provider === "openai") {
      responseText = await generateOpenAIResponse(transcript, apiKey);
    } else if (provider === "anthropic") {
      responseText = await generateAnthropicResponse(transcript, apiKey);
    } else if (provider === "google") {
      responseText = await generateGoogleResponse(transcript, apiKey);
    } else {
      responseText = await generateOpenAIResponse(transcript, apiKey);
    }

    // Step 3: Convert response to speech
    const audioUrl = await textToSpeech(responseText, apiKey);

    return res.status(200).json({
      transcript,
      response: responseText,
      audioUrl,
    });

  } catch (error: any) {
    console.error("Voice chat error:", error);
    return res.status(500).json({ 
      error: error.message || "Nepodařilo se zpracovat hlasovou zprávu" 
    });
  }
}

async function transcribeAudio(audioData: string, apiKey: string): Promise<string> {
  try {
    // Convert base64 to buffer then to Blob
    const buffer = Buffer.from(audioData.split(",")[1], "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "cs");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Chyba při přepisu zvuku");
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    throw new Error(`Whisper API error: ${error.message}`);
  }
}

async function generateOpenAIResponse(message: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Jsi užitečný AI asistent. Odpovídej stručně a přirozeně v češtině.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    throw new Error(`OpenAI chat error: ${error.message}`);
  }
}

async function generateAnthropicResponse(message: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        system: "Jsi užitečný AI asistent. Odpovídej stručně a přirozeně v češtině.",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Anthropic API error");
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error: any) {
    throw new Error(`Anthropic chat error: ${error.message}`);
  }
}

async function generateGoogleResponse(message: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Jsi užitečný AI asistent. Odpovídej stručně a přirozeně v češtině.\n\nUživatel: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Google API error");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    throw new Error(`Google chat error: ${error.message}`);
  }
}

async function textToSpeech(text: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "alloy",
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "TTS API error");
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error: any) {
    throw new Error(`TTS error: ${error.message}`);
  }
}