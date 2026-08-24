import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { listSettlements, saveSettlement } from "@/lib/admin.functions";
import { PageHeader, StatusPill, KpiCard } from "@/components/admin/ui-bits";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dateTime, money } from "@/lib/format";

export const Route = createFileRoute("/admin/settlements")({
  head: () => ({
    meta: [
      { title: "Règlements bancaires — Admin Zender237" },
      {
        name: "description",
        content: "Suivi des règlements bancaires Zender237 : initiation, exécution et clôture des virements.",
      },
      { property: "og:title", content: "Règlements bancaires — Admin Zender237" },
      { property: "og:description", content: "Suivi des règlements bancaires Zender237." },
    ],
  }),
  component: SettlementsPage,
});

type Form = {
  id?: string;
  settlement_type: string;
  amount: string;
  currency: string;
  status: string;
  external_reference: string;
  source_account_name: string;
  destination_account_name: string;
  notes: string;
  failure_reason: string;
};

const EMPTY: Form = {
  settlement_type: "payout",
  amount: "",
  currency: "XAF",
  status: "pending",
  external_reference: "",
  source_account_name: "",
  destination_account_name: "",
  notes: "",
  failure_reason: "",
};

const STATUSES = ["pending", "executed", "completed", "failed"];

function SettlementsPage() {
  const qc = useQueryClient();
  const fetchRows = useServerFn(listSettlements);
  const save = useServerFn(saveSettlement);
  const [form, setForm] = useState<Form>(EMPTY);
  const [open, setOpen] = useState(false);

  const { data, isPending } = useQuery({ queryKey: ["settlements"], queryFn: () => fetchRows() });
  const rows = data?.rows ?? [];

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: form.id,
          settlement_type: form.settlement_type,
          amount: Number(form.amount || 0),
          currency: form.currency || undefined,
          status: form.status || undefined,
          external_reference: form.external_reference || undefined,
          source_account_name: form.source_account_name || undefined,
          destination_account_name: form.destination_account_name || undefined,
          notes: form.notes || undefined,
          failure_reason: form.failure_reason || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Règlement enregistré");
      setForm(EMPTY);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["settlements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<any>[] = [
    {
      key: "type",
      header: "Type / Référence",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.settlement_type}</p>
          <p className="text-xs text-muted-foreground">{r.external_reference || "Sans référence"}</p>
        </div>
      ),
    },
    {
      key: "accounts",
      header: "Comptes",
      render: (r) => (
        <p className="text-xs text-muted-foreground">
          {(r.source_account_name || "—") + " → " + (r.destination_account_name || "—")}
        </p>
      ),
    },
    { key: "amount", header: "Montant", align: "right", render: (r) => money(r.amount, r.currency ?? "XAF") },
    { key: "status", header: "Statut", render: (r) => <StatusPill status={r.status} /> },
    {
      key: "dates",
      header: "Initié / Terminé",
      render: (r) => (
        <div className="text-xs text-muted-foreground">
          <p>{dateTime(r.initiated_at)}</p>
          <p>{dateTime(r.completed_at)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setForm({
              id: r.id,
              settlement_type: r.settlement_type ?? "payout",
              amount: String(r.amount ?? ""),
              currency: r.currency ?? "XAF",
              status: r.status ?? "pending",
              external_reference: r.external_reference ?? "",
              source_account_name: r.source_account_name ?? "",
              destination_account_name: r.destination_account_name ?? "",
              notes: r.notes ?? "",
              failure_reason: r.failure_reason ?? "",
            });
            setOpen(true);
          }}
        >
          Modifier
        </Button>
      ),
    },
  ];

  const total = (s: string) =>
    rows.filter((r: any) => r.status === s).reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0);

  return (
    <div className="reveal space-y-8">
      <PageHeader
        title="Règlements bancaires"
        subtitle="Virements entre comptes de collecte et comptes de reversement"
        actions={
          <Button
            className="gap-1.5"
            onClick={() => {
              setForm(EMPTY);
              setOpen((v) => !v);
            }}
          >
            <Plus className="size-4" /> Nouveau règlement
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="En attente" value={money(total("pending"))} tone="warning" />
        <KpiCard title="Exécutés" value={money(total("executed"))} />
        <KpiCard title="Terminés" value={money(total("completed"))} tone="success" />
      </div>

      {open ? (
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Input
            value={form.settlement_type}
            onChange={(e) => setForm({ ...form, settlement_type: e.target.value })}
            placeholder="Type (payout, collection…)"
          />
          <Input
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Montant"
            inputMode="numeric"
          />
          <Input
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            placeholder="Devise"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input
            value={form.external_reference}
            onChange={(e) => setForm({ ...form, external_reference: e.target.value })}
            placeholder="Référence externe"
          />
          <Input
            value={form.source_account_name}
            onChange={(e) => setForm({ ...form, source_account_name: e.target.value })}
            placeholder="Compte source"
          />
          <Input
            value={form.destination_account_name}
            onChange={(e) => setForm({ ...form, destination_account_name: e.target.value })}
            placeholder="Compte destination"
          />
          <Input
            value={form.failure_reason}
            onChange={(e) => setForm({ ...form, failure_reason: e.target.value })}
            placeholder="Motif d'échec (optionnel)"
          />
          <Textarea
            className="sm:col-span-2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes"
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button disabled={!form.amount || saveMut.isPending} onClick={() => saveMut.mutate()}>
              Enregistrer
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      <DataTable columns={columns} rows={rows} loading={isPending} empty="Aucun règlement enregistré." />
    </div>
  );
}
