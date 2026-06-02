import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ActivityAction = 
  | "INSTITUTION_AUTHORIZED"
  | "INSTITUTION_REVOKED"
  | "CERTIFICATE_REVOKED"
  | "ADMIN_ADDED"
  | "ADMIN_REMOVED";

export interface ActivityLog {
  id: string;
  action_type: ActivityAction;
  admin_address: string;
  target_address: string | null;
  target_id: string | null;
  details: Json | null;
  transaction_hash: string | null;
  created_at: string;
}

export async function logActivity(
  actionType: ActivityAction,
  adminAddress: string,
  options?: {
    targetAddress?: string;
    targetId?: string;
    details?: Json;
    transactionHash?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from("admin_activity_logs").insert([{
      action_type: actionType,
      admin_address: adminAddress.toLowerCase(),
      target_address: options?.targetAddress?.toLowerCase() || null,
      target_id: options?.targetId || null,
      details: options?.details || null,
      transaction_hash: options?.transactionHash || null,
    }]);

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function getActivityLogs(limit = 50): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch activity logs:", error);
      return [];
    }

    return (data || []) as ActivityLog[];
  } catch (err) {
    console.error("Failed to fetch activity logs:", err);
    return [];
  }
}

export function getActionLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    INSTITUTION_AUTHORIZED: "Institution Authorized",
    INSTITUTION_REVOKED: "Institution Revoked",
    CERTIFICATE_REVOKED: "Certificate Revoked",
    ADMIN_ADDED: "Admin Added",
    ADMIN_REMOVED: "Admin Removed",
  };
  return labels[action] || action;
}

export function getActionColor(action: ActivityAction): string {
  const colors: Record<ActivityAction, string> = {
    INSTITUTION_AUTHORIZED: "bg-primary/10 text-primary",
    INSTITUTION_REVOKED: "bg-orange-500/10 text-orange-500",
    CERTIFICATE_REVOKED: "bg-destructive/10 text-destructive",
    ADMIN_ADDED: "bg-blue-500/10 text-blue-500",
    ADMIN_REMOVED: "bg-red-500/10 text-red-500",
  };
  return colors[action] || "bg-muted text-muted-foreground";
}
