import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  // Try with anon client (should fail due to RLS)
  const supabaseAnon = createClient(supabaseUrl, anonKey);

  const { data: anonData, error: anonError } = await supabaseAnon
    .from("admin_settings")
    .select("provider, is_active")
    .limit(1);

  return res.status(200).json({
    anonTest: {
      hasData: !!anonData,
      dataCount: anonData?.length || 0,
      error: anonError ? {
        message: anonError.message,
        code: anonError.code,
        hint: anonError.hint
      } : null
    }
  });
}