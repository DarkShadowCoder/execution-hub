import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const db = supabaseAdmin;

export type AdminRow = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
  whatsapp_number: string | null;
  auth_user_id: string | null;
};

export async function assertAdmin(userId: string): Promise<AdminRow> {
  const { data, error } = await db
    .from("admins")
    .select("id, full_name, role, active, whatsapp_number, auth_user_id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("ADMIN_NOT_FOUND");
  if (!data.active) throw new Error("ADMIN_DISABLED");
  return data as AdminRow;
}

export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

export async function countTx(filter: (q: any) => any) {
  const q = db.from("transactions").select("id", { count: "exact", head: true });
  const { count, error } = await filter(q);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function logAction(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  newValue: unknown,
) {
  await db.from("kd_action_logs").insert({
    admin_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    new_value: newValue as never,
  });
}
