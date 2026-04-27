import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/integrations/supabase/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("[Test Admin] Testing supabaseAdmin client...");
    console.log("[Test Admin] Service role key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("[Test Admin] Service role key length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    
    // Try simple select that doesn't need RLS
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, credits")
      .limit(1);
    
    if (error) {
      console.error("[Test Admin] Error:", error);
      return res.status(500).json({ 
        error: error.message,
        details: error,
        keyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
    }
    
    console.log("[Test Admin] Success! Retrieved data:", data);
    return res.status(200).json({ 
      success: true, 
      data,
      keyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  } catch (error) {
    console.error("[Test Admin] Fatal error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}