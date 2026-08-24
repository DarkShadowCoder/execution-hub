import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { listMomo, saveMomo } from "@/lib/admin.functions";
import { PageHeader, StatusPill } from "@/components/admin/ui-bits";
import { DataTable } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/momo")({
  head: () => ({
    meta: [
      { title: "Numéros Mobile Money — Admin Zender237" },
      { name: "description", content: "Numéros Mobile Money utilisés pour les dépôts Zender237 et leurs plafonds." },
      { property: "og:title", content: "Numéros Mobile Money — Admin Zender237" },
      { property: "og:description", content: "Gestion des numéros de dépôt Mobile Money Zender237." },
    ],
  }),
  component: MomoPage,
});

type Form = { id?: string; phone_number: string; holder_name: string; min_amount: string; max_amount: string; active: boolean };
const EMPTY: Form = { phone_number: "", holder_name: "", min_amount: "", max_amount: "", active: true };

function MomoPage() {
  const qc = useQueryClient();
  const fetchMomo = useServerFn(listMomo);
  const save = useServerFn(saveMomo);
  const [form, setForm] = useState<Form>(EMPTY);
  const [open, setOpen] = useState(false);

  const { data, isPending } = useQuery({ queryKey: ["momo"], queryFn: () => fetchMomo() });

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: form.id,
          phone_number: form.phone_number,
          holder_name: form.holder_name,
          min_amount: form.min_amount ? Number(form.min_amount) : null,
          max_amount: form.max_amount ? Number(form.max_amount) : null,
          active: form.active,
        },
      }),
    onSuccess: () => {
      toast.success("Numéro enregistré");
      setForm(EMPTY);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["momo"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="reveal space-y-8">
      <PageHeader
        title="Numéros Mobile Money"
        subtitle="Comptes de réception utilisés pour les dépôts clients"
        actions={
          <Button
            className="gap-1.5"
            onClick={() => {
              setForm(EMPTY);
              setOpen((v) => !v);
            }}
          >
            <Plus className="size-4" /> Nouveau numéro
          </Button>
        }
      />

      {open ? (
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Input
            value={form.holder_name}
            onChange={(e) => setForm({ ...form, holder_name: e.target.value })}
            placeholder="Titulaire du compte"
          />
          <Input
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            placeholder="Numéro Mobile Money"
          />
          <Input
            type="number"
            value={form.min_amount}
            onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
            placeholder="Montant minimum"
          />
          <Input
            type="number"
            value={form.max_amount}
            onChange={(e) => setForm({ ...form, max_amount: e.target.value })}
            placeholder="Montant maximum"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Numéro actif
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button disabled={!form.phone_number || !form.holder_name || saveMut.isPending} onClick={() => saveMut.mutate()}>
              Enregistrer
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      <DataTable
        loading={isPending}
        rows={data?.rows}
        empty="Aucun numéro configuré."
        columns={[
          { key: "h", header: "Titulaire", render: (r: any) => r.holder_name },
          { key: "p", header: "Numéro", render: (r: any) => r.phone_number },
          { key: "mi", header: "Min", align: "right", render: (r: any) => (r.min_amount == null ? "—" : money(r.min_amount)) },
          { key: "ma", header: "Max", align: "right", render: (r: any) => (r.max_amount == null ? "—" : money(r.max_amount)) },
          { key: "s", header: "Statut", render: (r: any) => <StatusPill status={r.active ? "active" : "cancelled"} /> },
          {
            key: "a",
            header: "",
            align: "right",
            render: (r: any) => (
              <button
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => {
                  setForm({
                    id: r.id,
                    phone_number: r.phone_number ?? "",
                    holder_name: r.holder_name ?? "",
                    min_amount: r.min_amount == null ? "" : String(r.min_amount),
                    max_amount: r.max_amount == null ? "" : String(r.max_amount),
                    active: !!r.active,
                  });
                  setOpen(true);
                }}
              >
                Modifier
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
