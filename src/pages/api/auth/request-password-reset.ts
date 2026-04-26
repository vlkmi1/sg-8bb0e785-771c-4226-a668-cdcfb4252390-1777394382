import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email je povinný" });
    }

    // Create admin client for server-side operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`;

    // Use admin client to send password reset email
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (error) {
      console.error("Password reset error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ 
      message: "Pokud účet existuje, byl odeslán email pro obnovení hesla" 
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      error: "Nastala chyba při odesílání emailu" 
    });
  }
}