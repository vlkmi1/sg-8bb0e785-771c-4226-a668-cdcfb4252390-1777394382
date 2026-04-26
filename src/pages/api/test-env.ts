import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Return sanitized environment info for debugging
  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "..." || "MISSING",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "MISSING",
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  return res.status(200).json(env);
}