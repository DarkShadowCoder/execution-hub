import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { listBatches, processBatch } from "@/lib/admin.functions";
import { PageHeader, StatusPill, KpiCard } from "@/components/admin/ui-bits";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dateOnly, dateTime, money } from "@/lib/format";

export const Route = createFileRoute("/admin/batches")({
  head: () => ({
    meta: [
      { title: "Lots journaliers — Admin Zender237" },
      {
        name: "description",
        content: "Traitement des lots journaliers Zender237 : regroupement des transactions confirmées et virements.",
      },
      { property: "og:title", content: "Lots journaliers — Admin Zender237" },
      { property: "og:description", content: "Traitement des lots journaliers Zender237." },
    ],
  }),
  component: BatchesPage,
});

const STATUSES = ["pending", "processing", "transferred", "completed", "failed"];

function BatchesPage() {
  const qc = useQueryClient();
  const fetchRows = useServerFn(listBatches);
  const process = useServerFn(processBatch);
  const [active, setActive] = useState<any | null>(null);
  const [status, setStatus] = useState("completed");
  const [reference, setReference] = useState("");

  const { data, isPending } = useQuery({ queryKey: ["batches"], queryFn: () => fetchRows() });
  const rows = data?.rows ?? [];

  const processMut = useMutation({
    mutationFn: () =>
      process({ data: { id: active.id, status, transfer_reference: reference || undefined } }),
    onSuccess: () => {
      toast.success("Lot mis à jour");
      setActive(null);
      setReference("");
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<any>[] = [
    {
      key: "date",
      header: "Date du lot",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{dateOnly(r.batch_date)}</p>
          <p className="text-xs text-muted-foreground">{r.tx_count} transaction(s)</p>
        </div>
      ),
    },
    { key: "total", header: "Volume", align: "right", render: (r) => money(r.total) },
    { key: "status", header: "Statut", render: (r) => <StatusPill status={r.status} /> },
    {
      key: "ref",
      header: "Référence virement",
      render: (r) => <span className="text-xs text-muted-foreground">{r.transfer_reference || "—"}</span>,
    },
    {
      key: "processed",
      header: "Traité le",
      render: (r) => <span className="text-xs text-muted-foreground">{dateTime(r.processed_at)}</span>,
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
            setActive(r);
            setStatus(r.status === "pending" ? "processing" : "completed");
            setReference(r.transfer_reference ?? "");
          }}
        >
          Traiter
        </Button>
      ),
    },
  ];

  return (
    <div className="reveal space-y-8">
      <PageHeader title="Lots journaliers" subtitle="Regroupement quotidien des transactions confirmées" />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Lots" value={rows.length} />
        <KpiCard
          title="Lots en attente"
          value={rows.filter((r: any) => r.status !== "completed").length}
          tone="warning"
        />
        <KpiCard title="Transactions hors lot" value={data?.unbatched ?? 0} hint="Confirmées et non regroupées" />
      </div>

      {active ? (
        <Card className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="sm:col-span-3 text-sm font-medium text-foreground">
            Lot du {dateOnly(active.batch_date)} — {money(active.total)}
          </div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Référence du virement"
          />
          <div className="flex gap-2">
            <Button disabled={processMut.isPending} onClick={() => processMut.mutate()}>
              Valider
            </Button>
            <Button variant="outline" onClick={() => setActive(null)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      <DataTable columns={columns} rows={rows} loading={isPending} empty="Aucun lot journalier." />
    </div>
  );
}
