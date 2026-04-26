import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Debug - Environment Variables:", {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    serviceKeyLength: supabaseServiceKey?.length,
    serviceKeyPrefix: supabaseServiceKey?.substring(0, 30) + "..."
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: "Missing environment variables",
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
  }

  try {
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Debug - Fetching admin_settings...");

    const { data, error } = await supabaseAdmin
      .from("admin_settings")
      .select("provider, is_active, created_at")
      .order("provider");

    console.log("Debug - Query result:", {
      hasData: !!data,
      dataCount: data?.length,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    });

    if (error) {
      return res.status(500).json({
        error: "Database query failed",
        details: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      });
    }

    return res.status(200).json({
      success: true,
      providers: data,
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error("Debug - Unhandled error:", error);
    return res.status(500).json({
      error: "Unhandled error",
      message: error.message,
      stack: error.stack
    });
  }
}