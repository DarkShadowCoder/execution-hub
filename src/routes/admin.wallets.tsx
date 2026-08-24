import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listWallets } from "@/lib/admin.functions";
import { PageHeader, KpiCard } from "@/components/admin/ui-bits";
import { DataTable } from "@/components/admin/data-table";
import { money, dateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/wallets")({
  head: () => ({
    meta: [
      { title: "Wallets — Admin Zender237" },
      { name: "description", content: "Supervision des soldes disponibles et réservés de tous les wallets Zender237." },
      { property: "og:title", content: "Wallets — Admin Zender237" },
      { property: "og:description", content: "Soldes disponibles et réservés des wallets Zender237." },
    ],
  }),
  component: WalletsPage,
});

function WalletsPage() {
  const fetchWallets = useServerFn(listWallets);
  const { data, isPending } = useQuery({ queryKey: ["wallets"], queryFn: () => fetchWallets() });
  const rows = data?.rows ?? [];
  const available = rows.reduce((a: number, r: any) => a + Number(r.available_balance ?? 0), 0);
  const pending = rows.reduce((a: number, r: any) => a + Number(r.pending_balance ?? 0), 0);

  return (
    <div className="reveal space-y-8">
      <PageHeader title="Wallets" subtitle="Soldes clients et fonds réservés" />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Total disponible" value={money(available)} tone="success" />
        <KpiCard title="Total réservé" value={money(pending)} tone="warning" />
        <KpiCard title="Wallets" value={rows.length} />
      </div>
      <DataTable
        loading={isPending}
        rows={rows}
        empty="Aucun wallet."
        columns={[
          { key: "u", header: "Utilisateur", render: (r: any) => r.profile?.username ?? r.user_id },
          { key: "p", header: "Pays", render: (r: any) => <span className="capitalize">{r.profile?.country ?? "—"}</span> },
          { key: "a", header: "Disponible", align: "right", render: (r: any) => money(r.available_balance) },
          { key: "pe", header: "En attente", align: "right", render: (r: any) => money(r.pending_balance) },
          { key: "m", header: "Mise à jour", render: (r: any) => dateTime(r.updated_at) },
          {
            key: "o",
            header: "",
            align: "right",
            render: (r: any) => (
              <Link
                to="/admin/users/$id"
                params={{ id: r.user_id }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Voir le client
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
