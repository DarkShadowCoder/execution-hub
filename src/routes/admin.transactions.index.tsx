import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";

import { listTransactions } from "@/lib/admin.functions";
import { PageHeader, StatusPill, EmptyState } from "@/components/admin/ui-bits";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { money, dateTime, label, TX_TYPE_LABELS, TX_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/transactions/")({
  head: () => ({
    meta: [
      { title: "Transactions — Admin Zender237" },
      {
        name: "description",
        content: "Filtrez, examinez et traitez toutes les transactions Zender237 : dépôts, transferts et retraits.",
      },
      { property: "og:title", content: "Transactions — Admin Zender237" },
      { property: "og:description", content: "Supervision des dépôts, transferts et retraits Zender237." },
    ],
  }),
  component: TransactionsPage,
});

const STATUSES = ["", "pending_proof", "under_review", "confirmed", "rejected", "cancelled"];
const TYPES = ["", "deposit", "transfer", "withdrawal"];

function TransactionsPage() {
  const fetchList = useServerFn(listTransactions);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["transactions", status, type, search],
    queryFn: () => fetchList({ data: { status: status || undefined, type: type || undefined, search: search || undefined } }),
  });

  return (
    <div className="reveal space-y-5">
      <PageHeader title="Transactions" subtitle="Toutes les opérations financières de la plateforme" />

      <Card className="space-y-3 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un expéditeur, bénéficiaire ou numéro…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <FilterChip key={s || "all"} active={status === s} onClick={() => setStatus(s)}>
              {s ? label(TX_STATUS_LABELS, s) : "Tous les statuts"}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <FilterChip key={t || "all"} active={type === t} onClick={() => setType(t)}>
              {t ? label(TX_TYPE_LABELS, t) : "Tous les types"}
            </FilterChip>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <EmptyState message="Aucune transaction ne correspond à ces filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Expéditeur</th>
                  <th className="px-4 py-3 font-medium">Bénéficiaire</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                  <th className="px-4 py-3 text-right font-medium">Frais</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{dateTime(t.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{label(TX_TYPE_LABELS, t.type)}</td>
                    <td className="px-4 py-3">{t.sender_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div>{t.recipient_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{t.recipient_mobile_number ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{money(t.amount)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                      {money(t.fee_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/admin/transactions/$id"
                        params={{ id: t.id }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
