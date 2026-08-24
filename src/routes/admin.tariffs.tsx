import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { listTariffs, saveTariff } from "@/lib/admin.functions";
import { PageHeader } from "@/components/admin/ui-bits";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/tariffs")({
  head: () => ({
    meta: [
      { title: "Tarifs de transfert — Admin Zender237" },
      {
        name: "description",
        content: "Grille tarifaire Zender237 par corridor de pays et par tranche de montant.",
      },
      { property: "og:title", content: "Tarifs de transfert — Admin Zender237" },
      { property: "og:description", content: "Grille tarifaire Zender237 par corridor et tranche." },
    ],
  }),
  component: TariffsPage,
});

type Form = {
  id?: string;
  country_a: string;
  country_b: string;
  min_amount: string;
  max_amount: string;
  fee_amount: string;
};

const EMPTY: Form = { country_a: "", country_b: "", min_amount: "", max_amount: "", fee_amount: "" };

function TariffsPage() {
  const qc = useQueryClient();
  const fetchRows = useServerFn(listTariffs);
  const save = useServerFn(saveTariff);
  const [form, setForm] = useState<Form>(EMPTY);
  const [open, setOpen] = useState(false);

  const { data, isPending } = useQuery({ queryKey: ["tariffs"], queryFn: () => fetchRows() });
  const rows = data?.rows ?? [];

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: form.id,
          country_a: form.country_a.trim(),
          country_b: form.country_b.trim(),
          min_amount: Number(form.min_amount || 0),
          max_amount: Number(form.max_amount || 0),
          fee_amount: Number(form.fee_amount || 0),
        },
      }),
    onSuccess: () => {
      toast.success("Tarif enregistré");
      setForm(EMPTY);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["tariffs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<any>[] = [
    {
      key: "corridor",
      header: "Corridor",
      render: (r) => (
        <span className="font-medium text-foreground">
          {r.country_a} ↔ {r.country_b}
        </span>
      ),
    },
    {
      key: "range",
      header: "Tranche",
      render: (r) => (
        <span className="text-muted-foreground">
          {money(r.min_amount)} – {money(r.max_amount)}
        </span>
      ),
    },
    { key: "fee", header: "Frais", align: "right", render: (r) => money(r.fee_amount) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setForm({
              id: r.id,
              country_a: r.country_a ?? "",
              country_b: r.country_b ?? "",
              min_amount: String(r.min_amount ?? ""),
              max_amount: String(r.max_amount ?? ""),
              fee_amount: String(r.fee_amount ?? ""),
            });
            setOpen(true);
          }}
        >
          Modifier
        </Button>
      ),
    },
  ];

  return (
    <div className="reveal space-y-5">
      <PageHeader
        title="Tarifs"
        subtitle="Frais appliqués par corridor et tranche de montant"
        actions={
          <Button
            className="gap-1.5"
            onClick={() => {
              setForm(EMPTY);
              setOpen((v) => !v);
            }}
          >
            <Plus className="size-4" /> Nouveau tarif
          </Button>
        }
      />

      {open ? (
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Input
            value={form.country_a}
            onChange={(e) => setForm({ ...form, country_a: e.target.value })}
            placeholder="Pays A (ex. CM)"
          />
          <Input
            value={form.country_b}
            onChange={(e) => setForm({ ...form, country_b: e.target.value })}
            placeholder="Pays B (ex. FR)"
          />
          <Input
            value={form.min_amount}
            onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
            placeholder="Montant minimum"
            inputMode="numeric"
          />
          <Input
            value={form.max_amount}
            onChange={(e) => setForm({ ...form, max_amount: e.target.value })}
            placeholder="Montant maximum"
            inputMode="numeric"
          />
          <Input
            value={form.fee_amount}
            onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
            placeholder="Frais"
            inputMode="numeric"
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button
              disabled={!form.country_a || !form.country_b || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              Enregistrer
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      <DataTable columns={columns} rows={rows} loading={isPending} empty="Aucun tarif configuré." />
    </div>
  );
}
