import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const envCheck = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
      `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : "MISSING",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "MISSING",
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : "MISSING",
  };

  // Test Supabase connection with service role key
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: assistants, error } = await supabase
      .from("assistants")
      .select("id, name")
      .limit(3);

    return res.status(200).json({
      ...envCheck,
      supabaseTest: {
        success: !error,
        error: error?.message,
        assistantsCount: assistants?.length || 0,
        assistants: assistants?.map(a => ({ id: a.id, name: a.name })),
      },
    });
  } catch (error: any) {
    return res.status(200).json({
      ...envCheck,
      supabaseTest: {
        success: false,
        error: error.message,
      },
    });
  }
}