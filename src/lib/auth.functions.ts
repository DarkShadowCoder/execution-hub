import { createServerFn } from "@tanstack/react-start";

function normalizePhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.replace(/^0+/, "");
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Connexion administrateur par numéro de téléphone + code secret.
 * Le code secret est comparé au SHA-256 stocké dans admins.secret_code_hash,
 * puis une session Supabase est émise pour le compte auth lié (auth_user_id).
 */
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string; secretCode: string }) => ({
    phone: String(d?.phone ?? "").trim(),
    secretCode: String(d?.secretCode ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    if (!data.phone || !data.secretCode) throw new Error("INVALID_CREDENTIALS");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: admins, error } = await supabaseAdmin
      .from("admins")
      .select("id, full_name, role, active, whatsapp_number, auth_user_id, secret_code_hash, login_attempts");
    if (error) throw new Error(error.message);

    const target = normalizePhone(data.phone);
    const admin = (admins ?? []).find(
      (a) => a.whatsapp_number && normalizePhone(a.whatsapp_number) === target,
    );

    if (!admin) throw new Error("INVALID_CREDENTIALS");
    if (!admin.active) throw new Error("ADMIN_DISABLED");

    const hash = await sha256Hex(data.secretCode);
    if (!admin.secret_code_hash || admin.secret_code_hash.toLowerCase() !== hash) {
      await supabaseAdmin
        .from("admins")
        .update({ login_attempts: (admin.login_attempts ?? 0) + 1 })
        .eq("id", admin.id);
      throw new Error("INVALID_CREDENTIALS");
    }

    if (!admin.auth_user_id) throw new Error("ADMIN_NO_AUTH_ACCOUNT");

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
      admin.auth_user_id,
    );
    if (userErr || !userRes?.user?.email) throw new Error("ADMIN_NO_AUTH_ACCOUNT");

    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: userRes.user.email,
    });
    if (linkErr || !link?.properties?.hashed_token) throw new Error("SESSION_ISSUE_FAILED");

    if ((admin.login_attempts ?? 0) !== 0) {
      await supabaseAdmin.from("admins").update({ login_attempts: 0 }).eq("id", admin.id);
    }

    return {
      tokenHash: link.properties.hashed_token,
      email: userRes.user.email,
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        role: admin.role,
      },
    };
  });
