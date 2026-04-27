import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get auth audit log entries from last 24 hours
    const { data: auditLogs, error: auditError } = await supabaseAdmin
      .from("auth.audit_log_entries")
      .select("*")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (auditError && auditError.code !== "42P01") {
      console.log("Audit log error:", auditError);
    }

    // Try to get session info
    const { data: sessions, error: sessionError } = await supabaseAdmin.auth.admin.listUsers();

    // Calculate statistics from available data
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const sixHoursAgo = now - 6 * 60 * 60 * 1000;
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    let stats: any = {
      totalUsers: sessions?.users?.length || 0,
      auditLogsAvailable: !!auditLogs && auditLogs.length > 0,
      estimatedRateLimitInfo: {
        freeTrierLimits: {
          emailPasswordLogin: "~100 requests/hour per IP",
          tokenRefresh: "~100 requests/hour per IP",
          passwordReset: "~30 requests/hour per IP",
          magicLink: "~30 requests/hour per IP"
        },
        currentStatus: "Unknown (audit logs not accessible)",
        recommendation: "Wait 1-2 hours from last auth attempt and try again"
      }
    };

    if (auditLogs && auditLogs.length > 0) {
      // Count events by type
      const eventCounts: Record<string, number> = {};
      const last1h: any[] = [];
      const last6h: any[] = [];
      const last24h: any[] = [];

      auditLogs.forEach((log: any) => {
        const action = log.payload?.action || "unknown";
        eventCounts[action] = (eventCounts[action] || 0) + 1;

        const logTime = new Date(log.created_at).getTime();
        if (logTime > oneHourAgo) last1h.push(log);
        if (logTime > sixHoursAgo) last6h.push(log);
        if (logTime > twentyFourHoursAgo) last24h.push(log);
      });

      stats = {
        ...stats,
        auditLogsAvailable: true,
        eventCountsByType: eventCounts,
        requestsLastHour: last1h.length,
        requestsLast6Hours: last6h.length,
        requestsLast24Hours: last24h.length,
        estimatedRateLimitInfo: {
          ...stats.estimatedRateLimitInfo,
          currentStatus: last1h.length > 80 
            ? "⚠️ HIGH - Approaching or at rate limit" 
            : last1h.length > 50
            ? "🔶 MODERATE - Monitor usage"
            : "✅ NORMAL - Safe to use",
          recommendation: last1h.length > 80
            ? "WAIT: Rate limit likely active. Try again in 1-2 hours."
            : "OK: You can attempt to login now."
        }
      };
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      note: "Auth audit logs may not be accessible with current permissions. This shows best available information."
    });

  } catch (error: any) {
    console.error("Rate limit info error:", error);
    return res.status(500).json({ 
      error: error.message,
      suggestion: "Unable to fetch rate limit info. This is expected if audit logs are not accessible."
    });
  }
}