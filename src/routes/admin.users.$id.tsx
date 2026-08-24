import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { getUserDetail, adjustWallet } from "@/lib/admin.functions";
import { PageHeader, StatusPill, Field, KpiCard, EmptyState } from "@/components/admin/ui-bits";
import { DataTable } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { money, dateTime, label, TX_TYPE_LABELS } from "@/lib/format";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({
    meta: [
      { title: "Fiche utilisateur — Admin Zender237" },
      { name: "description", content: "Profil, wallet, transactions et grand livre d'un utilisateur Zender237." },
      { property: "og:title", content: "Fiche utilisateur — Admin Zender237" },
      { property: "og:description", content: "Profil, wallet et opérations d'un utilisateur Zender237." },
    ],
  }),
  component: UserDetail,
});

function UserDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchUser = useServerFn(getUserDetail);
  const adjust = useServerFn(adjustWallet);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data, isPending } = useQuery({ queryKey: ["user", id], queryFn: () => fetchUser({ data: { id } }) });

  const adjustMut = useMutation({
    mutationFn: () => adjust({ data: { userId: id, amount: Number(amount), note } }),
    onSuccess: () => {
      toast.success("Wallet ajusté");
      setAmount("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["user", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) return <Skeleton className="h-96" />;
  if (!data?.profile) return <EmptyState message="Utilisateur introuvable." />;

  return (
    <div className="reveal space-y-5">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Retour aux utilisateurs
      </Link>
      <PageHeader title={data.profile.username ?? "Utilisateur"} subtitle={`Inscrit le ${dateTime(data.profile.created_at)}`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Solde disponible" value={money(data.wallet?.available_balance ?? 0)} tone="success" />
        <KpiCard title="Solde en attente" value={money(data.wallet?.pending_balance ?? 0)} tone="warning" />
        <KpiCard title="Transactions" value={data.transactions.length} />
      </div>

      <Card className="grid gap-4 p-4 sm:grid-cols-3">
        <Field label="WhatsApp" value={data.profile.whatsapp_number ?? "—"} />
        <Field label="Pays" value={<span className="capitalize">{data.profile.country ?? "—"}</span>} />
        <Field label="Tentatives de connexion" value={String(data.profile.login_attempts ?? 0)} />
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="section-title">Ajustement de wallet</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Montant (négatif pour débiter)"
          />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motif de l'ajustement" />
          <Button disabled={!amount || !note || adjustMut.isPending} onClick={() => adjustMut.mutate()}>
            Appliquer
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="section-title">Transactions</h2>
        <DataTable
          rows={data.transactions}
          empty="Aucune transaction."
          columns={[
            { key: "d", header: "Date", render: (r: any) => dateTime(r.created_at) },
            { key: "t", header: "Type", render: (r: any) => label(TX_TYPE_LABELS, r.type) },
            { key: "b", header: "Bénéficiaire", render: (r: any) => r.recipient_name ?? "—" },
            { key: "a", header: "Montant", align: "right", render: (r: any) => money(r.amount) },
            { key: "s", header: "Statut", render: (r: any) => <StatusPill status={r.status} /> },
            {
              key: "o",
              header: "",
              align: "right",
              render: (r: any) => (
                <Link
                  to="/admin/transactions/$id"
                  params={{ id: r.id }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ouvrir
                </Link>
              ),
            },
          ]}
        />
      </div>

    </div>
  );
}
