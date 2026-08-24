import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { listAdmins, setAdminActive } from "@/lib/admin.functions";
import { PageHeader, StatusPill } from "@/components/admin/ui-bits";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — Admin Zender237" },
      {
        name: "description",
        content: "Paramètres d'administration Zender237 : comptes administrateurs et administrateurs KmerDiaspora.",
      },
      { property: "og:title", content: "Paramètres — Admin Zender237" },
      { property: "og:description", content: "Gestion des comptes administrateurs Zender237." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const fetchAdmins = useServerFn(listAdmins);
  const toggle = useServerFn(setAdminActive);

  const { data, isPending } = useQuery({ queryKey: ["admins"], queryFn: () => fetchAdmins() });

  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) => toggle({ data: vars }),
    onSuccess: () => {
      toast.success("Compte mis à jour");
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const baseColumns: Column<any>[] = [
    {
      key: "name",
      header: "Administrateur",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.full_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.whatsapp_number ?? "—"}</p>
        </div>
      ),
    },
    { key: "role", header: "Rôle", render: (r) => <span className="text-xs uppercase">{r.role ?? "—"}</span> },
    { key: "status", header: "Statut", render: (r) => <StatusPill status={r.active ? "active" : "cancelled"} /> },
  ];

  const adminColumns: Column<any>[] = [
    ...baseColumns,
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          disabled={toggleMut.isPending}
          onClick={() => toggleMut.mutate({ id: r.id, active: !r.active })}
        >
          {r.active ? "Désactiver" : "Activer"}
        </Button>
      ),
    },
  ];

  return (
    <div className="reveal space-y-8">
      <PageHeader title="Paramètres" subtitle="Comptes administrateurs de la plateforme" />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Administrateurs Zender237</h2>
        <DataTable columns={adminColumns} rows={data?.rows} loading={isPending} empty="Aucun administrateur." />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Administrateurs KmerDiaspora</h2>
        <DataTable columns={baseColumns} rows={data?.kma} loading={isPending} empty="Aucun administrateur KmerDiaspora." />
      </section>
    </div>
  );
}
