import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      // Zobrazit všechny API klíče (maskované)
      const { data: settings, error } = await supabase
        .from("admin_settings")
        .select("provider, is_active, created_at")
        .order("provider");

      if (error) throw error;

      const masked = settings?.map(s => ({
        ...s,
        has_key: true,
        status: s.is_active ? "✅ Aktivní" : "⏸️ Neaktivní"
      }));

      return res.status(200).json({
        success: true,
        settings: masked,
        message: "Pro změnu klíčů použijte POST request s provider a api_key"
      });
    }

    if (req.method === "POST") {
      const { provider, api_key, is_active } = req.body;

      if (!provider || !api_key) {
        return res.status(400).json({
          error: "Provider a api_key jsou povinné"
        });
      }

      // Update API klíče
      const { error } = await supabase
        .from("admin_settings")
        .update({ 
          api_key,
          is_active: is_active !== undefined ? is_active : true
        })
        .eq("provider", provider);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: `API klíč pro ${provider} byl úspěšně aktualizován`
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error: any) {
    console.error("Admin bypass error:", error);
    return res.status(500).json({ error: error.message });
  }
}