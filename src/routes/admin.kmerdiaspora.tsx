import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { getKmerDiaspora, moderateContent } from "@/lib/admin.functions";
import { PageHeader, StatusPill, KpiCard } from "@/components/admin/ui-bits";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dateOnly, dateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/kmerdiaspora")({
  head: () => ({
    meta: [
      { title: "KmerDiaspora — Admin Zender237" },
      {
        name: "description",
        content: "Supervision KmerDiaspora : demandes d'emploi, chauffeurs, quêtes, modération et rapports.",
      },
      { property: "og:title", content: "KmerDiaspora — Admin Zender237" },
      { property: "og:description", content: "Supervision et modération de l'espace KmerDiaspora." },
    ],
  }),
  component: KmerDiasporaPage,
});

type Target = { contentType: string; contentId: string; title: string } | null;

function KmerDiasporaPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getKmerDiaspora);
  const moderate = useServerFn(moderateContent);
  const [target, setTarget] = useState<Target>(null);
  const [newStatus, setNewStatus] = useState("approved");
  const [reason, setReason] = useState("");

  const { data, isPending } = useQuery({ queryKey: ["kmerdiaspora"], queryFn: () => fetchAll() });

  const moderateMut = useMutation({
    mutationFn: () =>
      moderate({
        data: {
          contentType: target!.contentType,
          contentId: target!.contentId,
          action: newStatus === "approved" ? "approve" : newStatus === "rejected" ? "reject" : "update",
          newStatus,
          reason: reason || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Contenu modéré");
      setTarget(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["kmerdiaspora"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moderationColumns = (type: string, titleKey: string): Column<any>[] => [
    {
      key: "title",
      header: "Contenu",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r[titleKey] ?? r.title ?? r.id?.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">{dateTime(r.created_at)}</p>
        </div>
      ),
    },
    { key: "status", header: "Statut", render: (r) => <StatusPill status={r.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTarget({ contentType: type, contentId: r.id, title: r[titleKey] ?? r.id });
            setNewStatus("approved");
          }}
        >
          Modérer
        </Button>
      ),
    },
  ];

  return (
    <div className="reveal space-y-8">
      <PageHeader title="KmerDiaspora" subtitle="Supervision de l'espace communautaire et modération" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Profils" value={data?.profiles.length ?? 0} />
        <KpiCard title="Offres d'emploi" value={data?.jobs.length ?? 0} />
        <KpiCard title="Demandes chauffeurs" value={data?.drivers.length ?? 0} />
        <KpiCard title="Quêtes" value={data?.quests.length ?? 0} />
      </div>

      {target ? (
        <Card className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="sm:col-span-3 text-sm font-medium text-foreground">Modération : {target.title}</div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {["approved", "rejected", "pending", "closed"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (optionnel)" />
          <div className="flex gap-2">
            <Button disabled={moderateMut.isPending} onClick={() => moderateMut.mutate()}>
              Appliquer
            </Button>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Emplois</TabsTrigger>
          <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
          <TabsTrigger value="quests">Quêtes</TabsTrigger>
          <TabsTrigger value="matches">Matchs</TabsTrigger>
          <TabsTrigger value="moderation">Historique</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <DataTable
            columns={moderationColumns("job", "title")}
            rows={data?.jobs}
            loading={isPending}
            empty="Aucune offre d'emploi."
          />
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          <DataTable
            columns={moderationColumns("driver", "pickup_location")}
            rows={data?.drivers}
            loading={isPending}
            empty="Aucune demande de chauffeur."
          />
        </TabsContent>

        <TabsContent value="quests" className="mt-4">
          <DataTable
            columns={moderationColumns("quest", "title")}
            rows={data?.quests}
            loading={isPending}
            empty="Aucune quête."
          />
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <DataTable
            columns={[
              { key: "id", header: "Match", render: (r: any) => <span className="text-xs">{r.id?.slice(0, 8)}</span> },
              { key: "status", header: "Statut", render: (r: any) => <StatusPill status={r.status} /> },
              {
                key: "matched",
                header: "Associé le",
                render: (r: any) => <span className="text-xs text-muted-foreground">{dateTime(r.matched_at)}</span>,
              },
            ]}
            rows={data?.matches}
            loading={isPending}
            empty="Aucun match."
          />
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <DataTable
            columns={[
              {
                key: "action",
                header: "Action",
                render: (r: any) => (
                  <div>
                    <p className="font-medium text-foreground">{r.action}</p>
                    <p className="text-xs text-muted-foreground">{r.content_type}</p>
                  </div>
                ),
              },
              {
                key: "transition",
                header: "Transition",
                render: (r: any) => (
                  <span className="text-xs text-muted-foreground">
                    {(r.old_status ?? "—") + " → " + (r.new_status ?? "—")}
                  </span>
                ),
              },
              { key: "reason", header: "Motif", render: (r: any) => <span className="text-xs">{r.reason || "—"}</span> },
              {
                key: "date",
                header: "Date",
                render: (r: any) => <span className="text-xs text-muted-foreground">{dateTime(r.created_at)}</span>,
              },
            ]}
            rows={data?.moderation}
            loading={isPending}
            empty="Aucune action de modération."
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <DataTable
            columns={[
              {
                key: "date",
                header: "Date",
                render: (r: any) => <span className="font-medium">{dateOnly(r.report_date)}</span>,
              },
              { key: "type", header: "Type", render: (r: any) => <span className="text-xs">{r.report_type ?? "—"}</span> },
              {
                key: "summary",
                header: "Résumé",
                render: (r: any) => (
                  <span className="text-xs text-muted-foreground">
                    {typeof r.content === "string" ? r.content : JSON.stringify(r.content ?? {}).slice(0, 120)}
                  </span>
                ),
              },
            ]}
            rows={data?.reports}
            loading={isPending}
            empty="Aucun rapport."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
