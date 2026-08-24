import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";

import { listUsers } from "@/lib/admin.functions";
import { PageHeader } from "@/components/admin/ui-bits";
import { DataTable } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { money, dateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/users/")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — Admin Zender237" },
      { name: "description", content: "Annuaire des utilisateurs Zender237 avec soldes de wallet et historique." },
      { property: "og:title", content: "Utilisateurs — Admin Zender237" },
      { property: "og:description", content: "Annuaire des utilisateurs Zender237 et de leurs wallets." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const fetchUsers = useServerFn(listUsers);
  const [search, setSearch] = useState("");
  const { data, isPending } = useQuery({
    queryKey: ["users", search],
    queryFn: () => fetchUsers({ data: { search: search || undefined } }),
  });

  return (
    <div className="reveal space-y-5">
      <PageHeader title="Utilisateurs" subtitle="Comptes clients et soldes associés" />
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom d'utilisateur ou numéro WhatsApp…"
            className="pl-9"
          />
        </div>
      </Card>
      <DataTable
        loading={isPending}
        rows={data?.rows}
        empty="Aucun utilisateur trouvé."
        columns={[
          { key: "u", header: "Utilisateur", render: (r: any) => r.username ?? "—" },
          { key: "w", header: "WhatsApp", render: (r: any) => r.whatsapp_number ?? "—" },
          { key: "c", header: "Pays", render: (r: any) => <span className="capitalize">{r.country ?? "—"}</span> },
          {
            key: "av",
            header: "Disponible",
            align: "right",
            render: (r: any) => money(r.wallet?.available_balance ?? 0),
          },
          {
            key: "pe",
            header: "En attente",
            align: "right",
            render: (r: any) => money(r.wallet?.pending_balance ?? 0),
          },
          { key: "d", header: "Inscription", render: (r: any) => dateTime(r.created_at) },
          {
            key: "a",
            header: "",
            align: "right",
            render: (r: any) => (
              <Link to="/admin/users/$id" params={{ id: r.id }} className="text-xs font-medium text-primary hover:underline">
                Ouvrir
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
