import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Admin endpoint to create verified user - use with caution
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, isAdmin } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Create user with service role (bypasses rate limits and email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return res.status(400).json({ error: authError.message });
    }

    // Update profile to set admin flag
    if (isAdmin && authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return res.status(400).json({ 
          error: "User created but failed to set admin flag",
          details: profileError.message 
        });
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        isAdmin: isAdmin || false,
      },
    });
  } catch (error: any) {
    console.error("Unhandled error:", error);
    return res.status(500).json({ error: error.message });
  }
}