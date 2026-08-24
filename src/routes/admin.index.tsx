import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Landmark,
  Users,
  Wallet,
  XCircle,
  Handshake,
  Coins,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDashboard } from "@/lib/admin.functions";
import { KpiCard, PageHeader, StatusPill, EmptyState } from "@/components/admin/ui-bits";
import { Card } from "@/components/ui/card";
import { money, dateTime, label, TX_TYPE_LABELS } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Console opérationnelle — Admin Zender237" },
      {
        name: "description",
        content: "Vue temps réel des transactions à traiter, règlements en attente et volumes Zender237.",
      },
      { property: "og:title", content: "Console opérationnelle — Admin Zender237" },
      { property: "og:description", content: "Transactions à traiter, règlements et volumes Zender237." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data, isPending } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });

  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div className="reveal space-y-8">
      <PageHeader
        title="Console opérationnelle"
        subtitle="Qu'est-ce qui nécessite votre intervention maintenant ?"
        actions={
          <Link
            to="/admin/transactions"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition-opacity hover:opacity-90"
          >
            <ArrowUpRight className="size-4" /> File de traitement
          </Link>
        }
      />

      {/* File d'attente opérationnelle */}
      <section className="space-y-3">
        <h2 className="section-title block">Interventions requises</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="À examiner" value={k.toReview} tone="warning" icon={<AlertTriangle className="size-4" />} />
          <KpiCard title="Preuves attendues" value={k.pendingProof} tone="warning" icon={<Clock className="size-4" />} />
          <KpiCard title="Confirmées" value={k.confirmed} tone="success" icon={<CheckCircle2 className="size-4" />} />
          <KpiCard title="Rejetées" value={k.rejected} tone="danger" icon={<XCircle className="size-4" />} />
        </div>
      </section>

      {/* Position financière — bande compacte */}
      <section className="space-y-3">
        <h2 className="section-title block">Position financière</h2>
        <Card className="surface grid gap-px overflow-hidden rounded-xl bg-line p-0 shadow-none sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Solde disponible", value: money(k.available), icon: <Wallet className="size-4" />, hint: "Fonds mobilisables" },
            { label: "Montant en attente", value: money(k.pending), icon: <Coins className="size-4" />, hint: "En cours de traitement" },
            { label: "Règlements en attente", value: String(k.pendingSettlements), icon: <Landmark className="size-4" />, hint: "À exécuter" },
            { label: "Utilisateurs", value: String(k.users), icon: <Users className="size-4" />, hint: `${k.partners} partenaires actifs` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-2 bg-surface px-5 py-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                {s.icon}
                <span className="mono-label truncate">{s.label}</span>
              </span>
              <p className="num font-display truncate text-[1.375rem] leading-none font-semibold text-foreground">
                {s.value}
              </p>
              <p className="truncate text-xs text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </Card>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="surface rounded-xl p-5 shadow-none lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="section-title block">Volumes des 14 derniers jours</h2>
            <span className="mono-label">XAF</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={60} />
                <Tooltip
                  formatter={(v: number) => money(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#vol)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="surface rounded-xl p-5 shadow-none">
          <h2 className="section-title mb-4 block">Répartition par type</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mix.map((m) => ({ ...m, type: label(TX_TYPE_LABELS, m.type) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="type" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={30} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-brand-yellow)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="surface rounded-xl p-0 shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="section-title">À traiter maintenant</h2>
            <Link
              to="/admin/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Tout voir <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {data.queue.length === 0 ? (
            <EmptyState message="Aucune transaction en attente d'intervention." />
          ) : (
            <ul className="divide-y divide-line">
              {data.queue.map((t: any) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-primary/[0.035]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {label(TX_TYPE_LABELS, t.type)}
                      </span>
                      <span className="num text-sm font-semibold text-foreground">
                        {money(t.amount)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {t.sender_name ?? "—"} → {t.recipient_name ?? "—"}
                    </p>
                    <p className="num mt-0.5 truncate text-[11px] text-muted-foreground/80">
                      {dateTime(t.created_at)}
                    </p>
                  </div>
                  <StatusPill status={t.status} />
                  <Link
                    to="/admin/transactions/$id"
                    params={{ id: t.id }}
                    className="rounded-lg bg-raised px-2.5 py-1.5 text-xs font-semibold text-foreground ring-1 ring-line transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Traiter
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="surface rounded-xl p-0 shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="section-title">Activité récente</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <Handshake className="size-3.5" /> {money(data.kpis.feesCollected)} de frais
            </span>
          </div>
          {data.recent.length === 0 ? (
            <EmptyState message="Aucune activité récente." />
          ) : (
            <ul className="divide-y divide-line">
              {data.recent.map((t: any) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {label(TX_TYPE_LABELS, t.type)}
                      </span>
                      <span className="num text-sm font-semibold text-foreground">
                        {money(t.amount)}
                      </span>
                    </div>
                    <p className="num mt-0.5 truncate text-[11px] text-muted-foreground">
                      {dateTime(t.created_at)}
                    </p>
                  </div>
                  <StatusPill status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
