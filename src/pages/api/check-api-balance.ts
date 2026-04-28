import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOpenAIBalance(apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/usage", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Try subscription endpoint instead
      const billingResponse = await fetch("https://api.openai.com/v1/dashboard/billing/subscription", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });
      
      if (billingResponse.ok) {
        const data = await billingResponse.json();
        return {
          success: true,
          balance: data.hard_limit_usd || null,
          currency: "USD",
        };
      }
    }

    return { success: false, message: "Unable to fetch balance" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function checkAnthropicBalance(apiKey: string) {
  // Anthropic doesn't provide a balance endpoint via API
  // We can only verify the key works
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (response.ok || response.status === 429) {
      return {
        success: true,
        balance: null,
        message: "API key valid (balance not available via API)",
      };
    }

    return { success: false, message: "Invalid API key" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function checkGoogleBalance(apiKey: string) {
  // Google AI Studio doesn't provide balance endpoint
  // Verify key by making a simple request
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (response.ok) {
      return {
        success: true,
        balance: null,
        message: "API key valid (balance not available via API)",
      };
    }

    return { success: false, message: "Invalid API key" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function checkStabilityBalance(apiKey: string) {
  try {
    const response = await fetch("https://api.stability.ai/v1/user/balance", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        balance: data.credits,
        currency: "credits",
      };
    }

    return { success: false, message: "Unable to fetch balance" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: "Missing provider or API key" });
    }

    let result;

    switch (provider) {
      case "openai":
        result = await checkOpenAIBalance(apiKey);
        break;
      case "anthropic":
        result = await checkAnthropicBalance(apiKey);
        break;
      case "google":
        result = await checkGoogleBalance(apiKey);
        break;
      case "stability":
        result = await checkStabilityBalance(apiKey);
        break;
      default:
        result = {
          success: false,
          message: "Balance check not supported for this provider",
        };
    }

    // Update balance in admin_settings if successful
    if (result.success && result.balance !== null && result.balance !== undefined) {
      await supabase
        .from("admin_settings")
        .update({
          balance: result.balance,
          balance_updated_at: new Date().toISOString(),
        })
        .eq("provider", provider);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Balance check error:", error);
    return res.status(500).json({ error: error.message });
  }
}