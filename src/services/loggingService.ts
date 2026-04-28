import { supabase } from "@/integrations/supabase/client";

export type LogLevel = "error" | "warning" | "info" | "success";
export type LogCategory = 
  | "auth" 
  | "api" 
  | "database" 
  | "payment" 
  | "generation" 
  | "system" 
  | "user_action"
  | "admin_action";

export interface LogEntry {
  id?: string;
  log_level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface LogFilters {
  level?: LogLevel;
  category?: LogCategory;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  userId?: string;
}

export interface LogStatistics {
  total_logs: number;
  errors: number;
  warnings: number;
  info: number;
  success: number;
  by_category: Record<string, number>;
}

export const loggingService = {
  /**
   * Log an event to the system
   */
  async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: any,
    userId?: string
  ): Promise<void> {
    try {
      // Get client info
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : undefined;

      const logEntry: Partial<LogEntry> = {
        log_level: level,
        category,
        message,
        details: details || null,
        user_id: userId || null,
        user_agent: userAgent,
      };

      const { error } = await supabase.from("system_logs" as any).insert(logEntry);

      if (error) {
        // Fallback to console if DB logging fails
        console.error("[Logging Service] Failed to log to database:", error);
        console.log(`[${level.toUpperCase()}] [${category}]`, message, details);
      }
    } catch (error) {
      // Silent fail - don't break the app if logging fails
      console.error("[Logging Service] Unexpected error:", error);
    }
  },

  /**
   * Convenience methods for different log levels
   */
  error(category: LogCategory, message: string, details?: any, userId?: string) {
    return this.log("error", category, message, details, userId);
  },

  warning(category: LogCategory, message: string, details?: any, userId?: string) {
    return this.log("warning", category, message, details, userId);
  },

  info(category: LogCategory, message: string, details?: any, userId?: string) {
    return this.log("info", category, message, details, userId);
  },

  success(category: LogCategory, message: string, details?: any, userId?: string) {
    return this.log("success", category, message, details, userId);
  },

  /**
   * Get logs with optional filters
   */
  async getLogs(filters?: LogFilters, limit = 100, offset = 0): Promise<LogEntry[]> {
    let query = supabase
      .from("system_logs" as any)
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.level) {
      query = query.eq("log_level", filters.level);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    if (filters?.searchTerm) {
      query = query.or(`message.ilike.%${filters.searchTerm}%,category.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching logs:", error);
      throw error;
    }

    return (data || []) as LogEntry[];
  },

  /**
   * Get log statistics
   */
  async getStatistics(days = 7): Promise<LogStatistics> {
    const { data, error } = await supabase.rpc("get_log_statistics", { days });

    if (error) {
      console.error("Error fetching log statistics:", error);
      throw error;
    }

    return data as LogStatistics;
  },

  /**
   * Clean old logs (admin only)
   */
  async cleanOldLogs(daysToKeep = 30): Promise<number> {
    const { data, error } = await supabase.rpc("clean_old_logs", {
      days_to_keep: daysToKeep,
    });

    if (error) {
      console.error("Error cleaning old logs:", error);
      throw error;
    }

    return data as number;
  },

  /**
   * Delete specific logs (admin only)
   */
  async deleteLogs(logIds: string[]): Promise<void> {
    const { error } = await supabase
      .from("system_logs" as any)
      .delete()
      .in("id", logIds);

    if (error) {
      console.error("Error deleting logs:", error);
      throw error;
    }
  },
};