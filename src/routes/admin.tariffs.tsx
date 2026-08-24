import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Upload, Download } from "lucide-react";
import { toast } from "sonner";

import { listTariffs, saveTariff, importTariffs } from "@/lib/admin.functions";
import { PageHeader } from "@/components/admin/ui-bits";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/format";
import { parseCsv, parseAmount, downloadCsv } from "@/lib/csv";


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

type ImportRow = {
  country_a: string;
  country_b: string;
  min_amount: number;
  max_amount: number;
  fee_amount: number;
};

const COUNTRY_ALIASES: Record<string, string> = {
  mali: "mali",
  ml: "mali",
  guinee: "guinee",
  guinée: "guinee",
  guinea: "guinee",
  gn: "guinee",
  cameroun: "cameroun",
  cameroon: "cameroun",
  cmr: "cameroun",
  cm: "cameroun",
};

function normCountry(raw: string) {
  const key = (raw ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return COUNTRY_ALIASES[key] ?? COUNTRY_ALIASES[raw?.toLowerCase()?.trim()] ?? "";
}

const TEMPLATE_ROWS: ImportRow[] = [
  { country_a: "mali", country_b: "cameroun", min_amount: 1, max_amount: 10000, fee_amount: 0 },
  { country_a: "mali", country_b: "cameroun", min_amount: 10001, max_amount: 30000, fee_amount: 2500 },
  { country_a: "guinee", country_b: "cameroun", min_amount: 1, max_amount: 10000, fee_amount: 0 },
  { country_a: "guinee", country_b: "cameroun", min_amount: 10001, max_amount: 30000, fee_amount: 4500 },
];

/**
 * Accepte deux formats :
 *  - country_a,country_b,min_amount,max_amount,fee_amount
 *  - corridor,min_amount,max_amount,fee_amount  (corridor = "Mali_Cameroun")
 */
function parseTariffCsv(text: string): ImportRow[] {
  const grid = parseCsv(text);
  if (grid.length === 0) throw new Error("Fichier vide");

  const head = grid[0]!.map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z_]/g, ""),
  );
  const idx = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const iA = idx("country_a", "paysa", "pays_a", "origine", "from");
  const iB = idx("country_b", "paysb", "pays_b", "destination", "to");
  const iCorr = idx("corridor", "couloir", "axe");
  const iMin = idx("min_amount", "min", "montantmin", "montant_min", "tranchemin");
  const iMax = idx("max_amount", "max", "montantmax", "montant_max", "tranchemax");
  const iFee = idx("fee_amount", "fee", "frais", "montantfrais");

  const hasHeader = iMin >= 0 && iMax >= 0 && iFee >= 0 && (iA >= 0 || iCorr >= 0);
  const body = hasHeader ? grid.slice(1) : grid;

  const out: ImportRow[] = [];
  body.forEach((cells, n) => {
    const line = n + (hasHeader ? 2 : 1);
    let a = "";
    let b = "";
    let min: number;
    let max: number;
    let fee: number;

    if (hasHeader && iCorr >= 0 && iA < 0) {
      const parts = (cells[iCorr] ?? "").split(/[_\-/↔>|]+/);
      a = normCountry(parts[0] ?? "");
      b = normCountry(parts[1] ?? "");
      min = parseAmount(cells[iMin] ?? "");
      max = parseAmount(cells[iMax] ?? "");
      fee = parseAmount(cells[iFee] ?? "");
    } else if (hasHeader) {
      a = normCountry(cells[iA] ?? "");
      b = normCountry(cells[iB] ?? "");
      min = parseAmount(cells[iMin] ?? "");
      max = parseAmount(cells[iMax] ?? "");
      fee = parseAmount(cells[iFee] ?? "");
    } else {
      if (cells.length < 5) throw new Error(`Ligne ${line} : 5 colonnes attendues`);
      a = normCountry(cells[0] ?? "");
      b = normCountry(cells[1] ?? "");
      min = parseAmount(cells[2] ?? "");
      max = parseAmount(cells[3] ?? "");
      fee = parseAmount(cells[4] ?? "");
    }

    if (!a || !b) throw new Error(`Ligne ${line} : pays inconnu (mali, guinee ou cameroun attendus)`);
    if ([min, max, fee].some((v) => !Number.isFinite(v))) throw new Error(`Ligne ${line} : montant illisible`);
    if (max < min) throw new Error(`Ligne ${line} : montant maximum inférieur au minimum`);
    out.push({ country_a: a, country_b: b, min_amount: min, max_amount: max, fee_amount: fee });
  });

  if (out.length === 0) throw new Error("Aucune ligne de tarif détectée");
  return out;
}

function TariffsPage() {
  const qc = useQueryClient();
  const fetchRows = useServerFn(listTariffs);
  const save = useServerFn(saveTariff);
  const runImport = useServerFn(importTariffs);
  const [form, setForm] = useState<Form>(EMPTY);
  const [open, setOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ name: string; rows: ImportRow[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isPending } = useQuery({ queryKey: ["tariffs"], queryFn: () => fetchRows() });
  const rows = data?.rows ?? [];

  const importMut = useMutation({
    mutationFn: () => runImport({ data: { rows: pendingImport?.rows ?? [], replaceAll: true } }),
    onSuccess: (res: { count: number }) => {
      toast.success(`${res.count} tarifs importés`);
      setPendingImport(null);
      qc.invalidateQueries({ queryKey: ["tariffs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFile(file: File) {
    try {
      const parsed = parseTariffCsv(await file.text());
      setPendingImport({ name: file.name, rows: parsed });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }


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
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="ghost"
              className="gap-1.5"
              onClick={() =>
                downloadCsv(
                  "modele-tarifs",
                  [
                    { header: "country_a", value: (r: ImportRow) => r.country_a },
                    { header: "country_b", value: (r: ImportRow) => r.country_b },
                    { header: "min_amount", value: (r: ImportRow) => r.min_amount },
                    { header: "max_amount", value: (r: ImportRow) => r.max_amount },
                    { header: "fee_amount", value: (r: ImportRow) => r.fee_amount },
                  ],
                  TEMPLATE_ROWS,
                )
              }
            >
              <Download className="size-4" /> Modèle CSV
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Importer un CSV
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                setForm(EMPTY);
                setOpen((v) => !v);
              }}
            >
              <Plus className="size-4" /> Nouveau tarif
            </Button>
          </div>
        }
      />

      {pendingImport ? (
        <Card className="space-y-3 p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {pendingImport.rows.length} tarifs détectés dans « {pendingImport.name} »
            </p>
            <p className="text-sm text-muted-foreground">
              L'import remplace intégralement la grille tarifaire actuelle ({rows.length} lignes).
            </p>
          </div>
          <div className="max-h-56 overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <tbody>
                {pendingImport.rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-1.5">
                      {r.country_a} ↔ {r.country_b}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground tabular-nums">
                      {money(r.min_amount)} – {money(r.max_amount)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{money(r.fee_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button disabled={importMut.isPending} onClick={() => importMut.mutate()}>
              {importMut.isPending ? "Import en cours…" : "Remplacer les tarifs"}
            </Button>
            <Button variant="outline" onClick={() => setPendingImport(null)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}


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
