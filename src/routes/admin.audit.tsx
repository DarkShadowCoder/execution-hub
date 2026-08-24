import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listAudit } from "@/lib/admin.functions";
import { PageHeader, StatusPill } from "@/components/admin/ui-bits";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit — Admin Zender237" },
      {
        name: "description",
        content: "Journal d'audit Zender237 : actions administrateurs, historique des statuts et notifications.",
      },
      { property: "og:title", content: "Audit — Admin Zender237" },
      { property: "og:description", content: "Journal complet des actions et notifications Zender237." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const fetchAudit = useServerFn(listAudit);
  const { data, isPending } = useQuery({ queryKey: ["audit"], queryFn: () => fetchAudit() });

  const logColumns: Column<any>[] = [
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.action}</p>
          <p className="text-xs text-muted-foreground">
            {(r.target_type ?? "—") + (r.target_id ? ` · ${String(r.target_id).slice(0, 8)}` : "")}
          </p>
        </div>
      ),
    },
    {
      key: "admin",
      header: "Admin",
      render: (r) => <span className="text-xs text-muted-foreground">{r.admin_id?.slice(0, 8) ?? "—"}</span>,
    },
    {
      key: "meta",
      header: "Détails",
      render: (r) => (
        <span className="text-xs break-all text-muted-foreground">
          {r.metadata ? JSON.stringify(r.metadata).slice(0, 140) : "—"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-xs text-muted-foreground">{dateTime(r.created_at)}</span>,
    },
  ];

  const historyColumns: Column<any>[] = [
    {
      key: "tx",
      header: "Transaction",
      render: (r) => <span className="font-mono text-xs">{String(r.transaction_id ?? "").slice(0, 8)}</span>,
    },
    {
      key: "transition",
      header: "Transition",
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusPill status={r.previous_status} />
          <span className="text-muted-foreground">→</span>
          <StatusPill status={r.new_status} />
        </div>
      ),
    },
    { key: "reason", header: "Motif", render: (r) => <span className="text-xs">{r.reason || "—"}</span> },
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-xs text-muted-foreground">{dateTime(r.created_at)}</span>,
    },
  ];

  const notifColumns: Column<any>[] = [
    {
      key: "channel",
      header: "Canal / Type",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.channel ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.notification_type ?? r.type ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "recipient",
      header: "Destinataire",
      render: (r) => <span className="text-xs">{r.recipient ?? r.user_id?.slice(0, 8) ?? "—"}</span>,
    },
    { key: "status", header: "Statut", render: (r) => <StatusPill status={r.status} /> },
    {
      key: "date",
      header: "Envoyée le",
      render: (r) => <span className="text-xs text-muted-foreground">{dateTime(r.sent_at)}</span>,
    },
  ];

  const logCsv: CsvColumn<any>[] = [
    { header: "Date", value: (r) => r.created_at },
    { header: "Action", value: (r) => r.action },
    { header: "Type de ressource", value: (r) => r.resource_type ?? r.target_type },
    { header: "Identifiant ressource", value: (r) => r.resource_id ?? r.target_id },
    { header: "Admin", value: (r) => r.admin_id },
    { header: "Détails", value: (r) => r.metadata ?? r.new_value },
  ];

  const historyCsv: CsvColumn<any>[] = [
    { header: "Date", value: (r) => r.created_at },
    { header: "Transaction", value: (r) => r.transaction_id },
    { header: "Statut précédent", value: (r) => r.previous_status },
    { header: "Nouveau statut", value: (r) => r.new_status },
    { header: "Étape précédente", value: (r) => r.previous_stage },
    { header: "Nouvelle étape", value: (r) => r.new_stage },
    { header: "Motif", value: (r) => r.reason },
  ];

  const notifCsv: CsvColumn<any>[] = [
    { header: "Envoyée le", value: (r) => r.sent_at },
    { header: "Canal", value: (r) => r.channel },
    { header: "Type", value: (r) => r.event_type ?? r.notification_type ?? r.type },
    { header: "Destinataire", value: (r) => r.recipient ?? r.user_id },
    { header: "Statut", value: (r) => r.status },
    { header: "Message", value: (r) => r.message },
  ];

  const exportButton = (label: string, onClick: () => void, disabled: boolean) => (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      <Download className="size-4" />
      {label}
    </Button>
  );

  return (
    <div className="reveal space-y-8">
      <PageHeader title="Audit" subtitle="Traçabilité complète des opérations de la plateforme" />

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Actions admin</TabsTrigger>
          <TabsTrigger value="history">Historique transactions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <DataTable
            columns={logColumns}
            rows={data?.logs}
            loading={isPending}
            empty="Aucune action enregistrée."
            searchable
            paginated
            searchPlaceholder="Rechercher une action…"
            toolbar={exportButton(
              "Exporter CSV",
              () => downloadCsv("audit-actions-admin", logCsv, data?.logs ?? []),
              !data?.logs?.length,
            )}
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <DataTable
            columns={historyColumns}
            rows={data?.history}
            loading={isPending}
            empty="Aucun changement de statut."
            searchable
            paginated
            searchPlaceholder="Rechercher une transition…"
            toolbar={exportButton(
              "Exporter CSV",
              () => downloadCsv("audit-historique-transactions", historyCsv, data?.history ?? []),
              !data?.history?.length,
            )}
          />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <DataTable
            columns={notifColumns}
            rows={data?.notifications}
            loading={isPending}
            empty="Aucune notification."
            searchable
            paginated
            searchPlaceholder="Rechercher une notification…"
            toolbar={exportButton(
              "Exporter CSV",
              () => downloadCsv("audit-notifications", notifCsv, data?.notifications ?? []),
              !data?.notifications?.length,
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
