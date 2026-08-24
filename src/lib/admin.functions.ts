import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    return { admin };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);

    const [txs, wallets, profiles, partners, settlements] = await Promise.all([
      db
        .from("transactions")
        .select(
          "id, type, status, amount, fee_amount, created_at, recipient_name, sender_name, recipient_country, user_id, workflow_stage",
        )
        .order("created_at", { ascending: false })
        .limit(400),
      db.from("wallets").select("available_balance, pending_balance"),
      db.from("profiles").select("id, username, country, created_at"),
      db.from("partners").select("id, active"),
      db.from("bank_settlements").select("id, status, amount"),
    ]);

    const rows = unwrap(txs) as any[];
    const w = unwrap(wallets) as any[];
    const p = unwrap(profiles) as any[];
    const pa = unwrap(partners) as any[];
    const st = unwrap(settlements) as any[];

    const byStatus = (s: string) => rows.filter((r) => r.status === s);
    const days: { day: string; volume: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRows = rows.filter((r) => (r.created_at ?? "").slice(0, 10) === key);
      days.push({
        day: key.slice(5),
        volume: dayRows.reduce((a, r) => a + Number(r.amount ?? 0), 0),
        count: dayRows.length,
      });
    }

    return {
      kpis: {
        toReview: byStatus("under_review").length,
        pendingProof: byStatus("pending_proof").length,
        confirmed: byStatus("confirmed").length,
        rejected: byStatus("rejected").length,
        pendingSettlements: st.filter((s) => s.status !== "completed").length,
        available: w.reduce((a, r) => a + Number(r.available_balance ?? 0), 0),
        pending: w.reduce((a, r) => a + Number(r.pending_balance ?? 0), 0),
        users: p.length,
        partners: pa.filter((x) => x.active).length,
        feesCollected: rows
          .filter((r) => r.status === "confirmed")
          .reduce((a, r) => a + Number(r.fee_amount ?? 0), 0),
      },
      queue: rows.filter((r) => r.status === "under_review" || r.status === "pending_proof").slice(0, 8),
      recent: rows.slice(0, 8),
      series: days,
      mix: ["deposit", "transfer", "withdrawal"].map((t) => ({
        type: t,
        count: rows.filter((r) => r.type === t).length,
      })),
    };
  });

export const listTransactions = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string | undefined; type?: string | undefined; search?: string | undefined } | undefined) => d ?? {})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    let q = db
      .from("transactions")
      .select(
        "id, type, status, workflow_stage, amount, fee_amount, created_at, sender_name, sender_phone_number, recipient_name, recipient_mobile_number, recipient_country, user_id, partner_id",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status as never);
    if (data.type) q = q.eq("type", data.type as never);
    if (data.search)
      q = q.or(
        `sender_name.ilike.%${data.search}%,recipient_name.ilike.%${data.search}%,recipient_mobile_number.ilike.%${data.search}%`,
      );
    return { rows: unwrap(await q) as any[] };
  });

export const getTransaction = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    const { data: tx, error } = await db.from("transactions").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!tx) throw new Error("Transaction introuvable");
    const [profile, proofs, execProofs, history, reviews, assignments, momo] = await Promise.all([
      db.from("profiles").select("id, username, whatsapp_number, country").eq("id", (tx as any).user_id).maybeSingle(),
      db.from("transaction_proofs").select("*").eq("transaction_id", data.id),
      db.from("transaction_execution_proofs").select("*").eq("transaction_id", data.id),
      db
        .from("transaction_status_history")
        .select("*")
        .eq("transaction_id", data.id)
        .order("created_at", { ascending: false }),
      db.from("transaction_reviews").select("*").eq("transaction_id", data.id),
      db.from("transaction_assignments").select("*").eq("transaction_id", data.id),
      (tx as any).momo_deposit_number_id
        ? db.from("momo_deposit_numbers").select("*").eq("id", (tx as any).momo_deposit_number_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    return {
      tx: tx as any,
      profile: (profile as any).data,
      proofs: unwrap(proofs) as any[],
      execProofs: unwrap(execProofs) as any[],
      history: unwrap(history) as any[],
      reviews: unwrap(reviews) as any[],
      assignments: unwrap(assignments) as any[],
      momo: (momo as any).data,
    };
  });

export const decideTransaction = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string; reason?: string | undefined; proofUrl?: string | undefined }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const { data: current, error: e0 } = await db
      .from("transactions")
      .select("status, workflow_stage")
      .eq("id", data.id)
      .maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!current) throw new Error("Transaction introuvable");
    if (data.status === "confirmed" && !data.proofUrl) {
      const { count } = await db
        .from("transaction_execution_proofs")
        .select("id", { count: "exact", head: true })
        .eq("transaction_id", data.id);
      if (!count) throw new Error("Une preuve d'exécution est obligatoire avant la confirmation.");
    }
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: data.status,
      admin_id: admin.id,
      last_action_at: now,
      workflow_stage: data.status,
    };
    if (data.status === "confirmed") patch['confirmed_at'] = now;
    if (data.status === "rejected") {
      patch['rejected_at'] = now;
      patch['rejection_reason'] = data.reason ?? null;
    }
    if (data.status === "cancelled") patch['cancelled_at'] = now;
    if (data.status === "under_review") patch['first_reviewed_at'] = now;

    const { error } = await db.from("transactions").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);

    await db.from("transaction_status_history").insert({
      transaction_id: data.id,
      previous_status: (current as any).status,
      new_status: data.status,
      previous_stage: (current as any).workflow_stage,
      new_stage: data.status,
      changed_by_admin_id: admin.id,
      reason: data.reason ?? null,
    } as never);
    await db.from("transaction_reviews").insert({
      transaction_id: data.id,
      admin_id: admin.id,
      decision: data.status,
      reason: data.reason ?? null,
      proof_url: data.proofUrl ?? null,
    } as never);
    await logAction(admin.id, `transaction.${data.status}`, "transaction", data.id, patch);
    return { ok: true };
  });

export const addExecutionProof = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; fileUrl: string; description?: string | undefined }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const { error } = await db.from("transaction_execution_proofs").insert({
      transaction_id: data.id,
      file_url: data.fileUrl,
      description: data.description ?? null,
      uploaded_by_admin_id: admin.id,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadExecutionProof = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id: string;
      fileName: string;
      contentType: string;
      dataBase64: string;
      description?: string | undefined;
    }) => d,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);

    const binary = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    if (binary.byteLength > 10 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 10 Mo)");

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `execution/${data.id}/${Date.now()}-${safeName}`;

    const { error: upErr } = await db.storage
      .from("transaction-proofs")
      .upload(path, binary, { contentType: data.contentType || "application/octet-stream", upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = db.storage.from("transaction-proofs").getPublicUrl(path);

    const { error } = await db.from("transaction_execution_proofs").insert({
      transaction_id: data.id,
      file_url: pub.publicUrl,
      description: data.description ?? null,
      uploaded_by_admin_id: admin.id,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true, url: pub.publicUrl };
  });

export const assignTransaction = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; partnerId: string; responsibility: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const now = new Date().toISOString();
    const { error } = await db
      .from("transactions")
      .update({ partner_id: data.partnerId, assigned_at: now, last_action_at: now } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await db.from("transaction_assignments").insert({
      transaction_id: data.id,
      partner_id: data.partnerId,
      admin_id: admin.id,
      responsibility: data.responsibility,
      status: "assigned",
    } as never);
    await logAction(admin.id, "transaction.assign", "transaction", data.id, { partnerId: data.partnerId });
    return { ok: true };
  });

export const listUsers = createServerFn({ method: "GET" })
  .inputValidator((d: { search?: string | undefined } | undefined) => d ?? {})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    let q = db
      .from("profiles")
      .select("id, username, whatsapp_number, country, created_at, login_attempts")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.search) q = q.or(`username.ilike.%${data.search}%,whatsapp_number.ilike.%${data.search}%`);
    const rows = unwrap(await q) as any[];
    const wallets = unwrap(await db.from("wallets").select("user_id, available_balance, pending_balance")) as any[];
    return {
      rows: rows.map((r) => ({ ...r, wallet: wallets.find((w) => w.user_id === r.id) ?? null })),
    };
  });

export const getUserDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    const [profile, wallet, txs, ledger] = await Promise.all([
      db.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      db.from("wallets").select("*").eq("user_id", data.id).maybeSingle(),
      db
        .from("transactions")
        .select("id, type, status, amount, fee_amount, created_at, recipient_name")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("wallet_ledger_entries")
        .select("*")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      profile: (profile as any).data,
      wallet: (wallet as any).data,
      transactions: unwrap(txs) as any[],
      ledger: unwrap(ledger) as any[],
    };
  });

export const adjustWallet = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; amount: number; note: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const { data: wallet, error } = await db
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!wallet) throw new Error("Wallet introuvable");
    const before = Number((wallet as any).available_balance ?? 0);
    const after = before + Number(data.amount);
    if (after < 0) throw new Error("Le solde ne peut pas devenir négatif.");
    const up = await db
      .from("wallets")
      .update({ available_balance: after, updated_at: new Date().toISOString() } as never)
      .eq("id", (wallet as any).id);
    if (up.error) throw new Error(up.error.message);
    await db.from("wallet_ledger_entries").insert({
      wallet_id: (wallet as any).id,
      user_id: data.userId,
      entry_type: Number(data.amount) >= 0 ? "admin_credit" : "admin_debit",
      amount: Math.abs(Number(data.amount)),
      balance_before: before,
      balance_after: after,
      source_type: "admin_adjustment",
      created_by_admin_id: admin.id,
      metadata: { note: data.note } as never,
    } as never);
    await logAction(admin.id, "wallet.adjust", "wallet", (wallet as any).id, { amount: data.amount, note: data.note });
    return { ok: true, after };
  });

export const listWallets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    const wallets = unwrap(
      await db.from("wallets").select("*").order("available_balance", { ascending: false }).limit(300),
    ) as any[];
    const profiles = unwrap(await db.from("profiles").select("id, username, country, whatsapp_number")) as any[];
    return { rows: wallets.map((w) => ({ ...w, profile: profiles.find((p) => p.id === w.user_id) ?? null })) };
  });

export const listPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    return {
      rows: unwrap(await db.from("partners").select("*").order("created_at", { ascending: false })) as any[],
    };
  });

export const savePartner = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { id?: string | undefined; full_name: string; phone_number?: string | undefined; whatsapp_number?: string | undefined; active?: boolean | undefined; notes?: string | undefined }) =>
      d,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const payload = {
      full_name: data.full_name,
      phone_number: data.phone_number ?? null,
      whatsapp_number: data.whatsapp_number ?? null,
      active: data.active ?? true,
      notes: data.notes ?? null,
    };
    const res = data.id
      ? await db.from("partners").update(payload as never).eq("id", data.id)
      : await db.from("partners").insert(payload as never);
    if (res.error) throw new Error(res.error.message);
    await logAction(admin.id, data.id ? "partner.update" : "partner.create", "partner", data.id ?? null, payload);
    return { ok: true };
  });

export const listMomo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    return { rows: unwrap(await db.from("momo_deposit_numbers").select("*").order("holder_name")) as any[] };
  });

export const saveMomo = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id?: string | undefined;
      phone_number: string;
      holder_name: string;
      min_amount?: number | null | undefined;
      max_amount?: number | null | undefined;
      active?: boolean | undefined;
    }) => d,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const payload = {
      phone_number: data.phone_number,
      holder_name: data.holder_name,
      min_amount: data.min_amount ?? null,
      max_amount: data.max_amount ?? null,
      active: data.active ?? true,
    };
    const res = data.id
      ? await db.from("momo_deposit_numbers").update(payload as never).eq("id", data.id)
      : await db.from("momo_deposit_numbers").insert(payload as never);
    if (res.error) throw new Error(res.error.message);
    await logAction(admin.id, data.id ? "momo.update" : "momo.create", "momo_deposit_number", data.id ?? null, payload);
    return { ok: true };
  });

export const listTariffs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    return {
      rows: unwrap(
        await db
          .from("transfer_fee_tariffs")
          .select("*")
          .order("country_a")
          .order("country_b")
          .order("min_amount"),
      ) as any[],
    };
  });

export const saveTariff = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id?: string | undefined;
      country_a: string;
      country_b: string;
      min_amount: number;
      max_amount: number;
      fee_amount: number;
    }) => d,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const payload = {
      country_a: data.country_a,
      country_b: data.country_b,
      min_amount: data.min_amount,
      max_amount: data.max_amount,
      fee_amount: data.fee_amount,
    };
    const res = data.id
      ? await db.from("transfer_fee_tariffs").update(payload as never).eq("id", data.id)
      : await db.from("transfer_fee_tariffs").insert(payload as never);
    if (res.error) throw new Error(res.error.message);
    await logAction(admin.id, data.id ? "tariff.update" : "tariff.create", "tariff", data.id ?? null, payload);
    return { ok: true };
  });

export const listSettlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    return {
      rows: unwrap(
        await db.from("bank_settlements").select("*").order("initiated_at", { ascending: false }).limit(200),
      ) as any[],
    };
  });

export const saveSettlement = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id?: string | undefined;
      settlement_type: string;
      amount: number;
      currency?: string | undefined;
      status?: string | undefined;
      external_reference?: string | undefined;
      source_account_name?: string | undefined;
      destination_account_name?: string | undefined;
      notes?: string | undefined;
      failure_reason?: string | undefined;
    }) => d,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      settlement_type: data.settlement_type,
      amount: data.amount,
      currency: data.currency ?? "XAF",
      status: data.status ?? "pending",
      external_reference: data.external_reference ?? null,
      source_account_name: data.source_account_name ?? null,
      destination_account_name: data.destination_account_name ?? null,
      notes: data.notes ?? null,
      failure_reason: data.failure_reason ?? null,
      admin_id: admin.id,
    };
    if (data.status === "executed") payload['executed_at'] = now;
    if (data.status === "completed") payload['completed_at'] = now;
    const res = data.id
      ? await db.from("bank_settlements").update(payload as never).eq("id", data.id)
      : await db.from("bank_settlements").insert(payload as never);
    if (res.error) throw new Error(res.error.message);
    await logAction(admin.id, data.id ? "settlement.update" : "settlement.create", "settlement", data.id ?? null, payload);
    return { ok: true };
  });

export const listBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    const rows = unwrap(
      await db.from("daily_batches").select("*").order("batch_date", { ascending: false }).limit(120),
    ) as any[];
    const txs = unwrap(await db.from("transactions").select("id, batch_id, amount, status")) as any[];
    return {
      rows: rows.map((b) => {
        const inBatch = txs.filter((t) => t.batch_id === b.id);
        return { ...b, tx_count: inBatch.length, total: inBatch.reduce((a, t) => a + Number(t.amount ?? 0), 0) };
      }),
      unbatched: txs.filter((t) => !t.batch_id && t.status === "confirmed").length,
    };
  });

export const processBatch = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string; transfer_reference?: string | undefined }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const { error } = await db
      .from("daily_batches")
      .update({
        status: data.status,
        processed_by: admin.id,
        processed_at: new Date().toISOString(),
        transfer_reference: data.transfer_reference ?? null,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAction(admin.id, "batch.process", "daily_batch", data.id, { status: data.status });
    return { ok: true };
  });

export const getKmerDiaspora = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    const [jobs, drivers, matches, quests, moderation, reports, kdProfiles] = await Promise.all([
      db.from("kd_job_requests").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("kd_driver_requests").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("kd_driver_matches").select("*").order("matched_at", { ascending: false }).limit(200),
      db.from("kd_quests").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("kd_moderation_actions").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("kd_reports").select("*").order("report_date", { ascending: false }).limit(200),
      db.from("kd_profiles").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    return {
      jobs: unwrap(jobs) as any[],
      drivers: unwrap(drivers) as any[],
      matches: unwrap(matches) as any[],
      quests: unwrap(quests) as any[],
      moderation: unwrap(moderation) as any[],
      reports: unwrap(reports) as any[],
      profiles: unwrap(kdProfiles) as any[],
    };
  });

export const moderateContent = createServerFn({ method: "POST" })
  .inputValidator((d: { contentType: string; contentId: string; action: string; newStatus: string; reason?: string | undefined }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const table = data.contentType === "quest" ? "kd_quests" : data.contentType === "job" ? "kd_job_requests" : "kd_driver_requests";
    const { data: before } = await db.from(table as never).select("status").eq("id", data.contentId).maybeSingle();
    const up = await db.from(table as never).update({ status: data.newStatus } as never).eq("id", data.contentId);
    if (up.error) throw new Error(up.error.message);
    await db.from("kd_moderation_actions").insert({
      content_type: data.contentType,
      content_id: data.contentId,
      admin_id: admin.id,
      action: data.action,
      reason: data.reason ?? null,
      old_status: (before as any)?.status ?? null,
      new_status: data.newStatus,
    } as never);
    await logAction(admin.id, `moderation.${data.action}`, data.contentType, data.contentId, { newStatus: data.newStatus });
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    const [logs, history, notifications] = await Promise.all([
      db.from("kd_action_logs").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("transaction_status_history").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("notifications_log").select("*").order("sent_at", { ascending: false }).limit(200),
    ]);
    return {
      logs: unwrap(logs) as any[],
      history: unwrap(history) as any[],
      notifications: unwrap(notifications) as any[],
    };
  });

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, db, unwrap } = await import("./admin.server");
    await assertAdmin(context.userId);
    return {
      rows: unwrap(await db.from("admins").select("id, full_name, role, active, whatsapp_number")) as any[],
      kma: unwrap(await db.from("kmerdiaspora_admins").select("id, full_name, role, active, whatsapp_number")) as any[],
    };
  });

export const setAdminActive = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; active: boolean }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { assertAdmin, db, logAction } = await import("./admin.server");
    const admin = await assertAdmin(context.userId);
    const { error } = await db.from("admins").update({ active: data.active } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAction(admin.id, "settings.admin.toggle", "admin", data.id, { active: data.active });
    return { ok: true };
  });
