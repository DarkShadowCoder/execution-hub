import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { listPartners, savePartner } from "@/lib/admin.functions";
import { PageHeader, StatusPill } from "@/components/admin/ui-bits";
import { DataTable } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/partners")({
  head: () => ({
    meta: [
      { title: "Partenaires — Admin Zender237" },
      { name: "description", content: "Gestion des partenaires d'exécution Zender237 : contacts, activation et notes." },
      { property: "og:title", content: "Partenaires — Admin Zender237" },
      { property: "og:description", content: "Gestion des partenaires d'exécution Zender237." },
    ],
  }),
  component: PartnersPage,
});

type Form = {
  id?: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string;
  notes: string;
  active: boolean;
};

const EMPTY: Form = { full_name: "", phone_number: "", whatsapp_number: "", notes: "", active: true };

function PartnersPage() {
  const qc = useQueryClient();
  const fetchPartners = useServerFn(listPartners);
  const save = useServerFn(savePartner);
  const [form, setForm] = useState<Form>(EMPTY);
  const [open, setOpen] = useState(false);

  const { data, isPending } = useQuery({ queryKey: ["partners"], queryFn: () => fetchPartners() });

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: form.id,
          full_name: form.full_name,
          phone_number: form.phone_number || undefined,
          whatsapp_number: form.whatsapp_number || undefined,
          notes: form.notes || undefined,
          active: form.active,
        },
      }),
    onSuccess: () => {
      toast.success("Partenaire enregistré");
      setForm(EMPTY);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["partners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="reveal space-y-8">
      <PageHeader
        title="Partenaires"
        subtitle="Réseau d'exécution sur le terrain"
        actions={
          <Button
            className="gap-1.5"
            onClick={() => {
              setForm(EMPTY);
              setOpen((v) => !v);
            }}
          >
            <Plus className="size-4" /> Nouveau partenaire
          </Button>
        }
      />

      {open ? (
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Nom complet"
          />
          <Input
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            placeholder="Téléphone"
          />
          <Input
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            placeholder="WhatsApp"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Partenaire actif
          </label>
          <Textarea
            className="sm:col-span-2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes internes"
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button disabled={!form.full_name || saveMut.isPending} onClick={() => saveMut.mutate()}>
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
        empty="Aucun partenaire enregistré."
        columns={[
          { key: "n", header: "Nom", render: (r: any) => r.full_name },
          { key: "p", header: "Téléphone", render: (r: any) => r.phone_number ?? "—" },
          { key: "w", header: "WhatsApp", render: (r: any) => r.whatsapp_number ?? "—" },
          { key: "s", header: "Statut", render: (r: any) => <StatusPill status={r.active ? "active" : "cancelled"} /> },
          { key: "c", header: "Créé le", render: (r: any) => dateTime(r.created_at) },
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
                    full_name: r.full_name ?? "",
                    phone_number: r.phone_number ?? "",
                    whatsapp_number: r.whatsapp_number ?? "",
                    notes: r.notes ?? "",
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
