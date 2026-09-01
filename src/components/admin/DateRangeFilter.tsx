import { CalendarDays, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { money as fmt } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DateRange = { from: string; to: string };

export const EMPTY_RANGE: DateRange = { from: "", to: "" };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shift(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return iso(d);
}

export function rangeLabel(range: DateRange) {
  if (!range.from && !range.to) return "Toutes les dates";
  if (range.from && range.from === range.to) return `Le ${range.from}`;
  if (range.from && range.to) return `Du ${range.from} au ${range.to}`;
  if (range.from) return `Depuis le ${range.from}`;
  return `Jusqu'au ${range.to}`;
}

const PRESETS: { label: string; get: () => DateRange }[] = [
  { label: "Aujourd'hui", get: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  { label: "Hier", get: () => ({ from: shift(1), to: shift(1) }) },
  { label: "7 derniers jours", get: () => ({ from: shift(6), to: iso(new Date()) }) },
  { label: "30 derniers jours", get: () => ({ from: shift(29), to: iso(new Date()) }) },
];

export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  className?: string;
}) {
  const active = !!(value.from || value.to);

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="mono-label flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-3.5" /> Du
          </span>
          <Input
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="h-9 w-[9.5rem]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="mono-label text-muted-foreground">Au</span>
          <Input
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="h-9 w-[9.5rem]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => {
          const r = p.get();
          const isActive = value.from === r.from && value.to === r.to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(r)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          );
        })}
        {active && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_RANGE)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-3" /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

export type Totals = {
  depositAmount: number;
  depositCount: number;
  transferAmount: number;
  transferCount: number;
  withdrawalAmount: number;
  withdrawalCount: number;
  transferFees: number;
  withdrawalFees: number;
  totalFees: number;
  count: number;
};

export function TotalsStrip({ totals }: { totals: Totals }) {
  const items = [
    { label: "Total dépôts", value: totals.depositAmount, hint: `${totals.depositCount} opération(s)` },
    { label: "Total transferts", value: totals.transferAmount, hint: `${totals.transferCount} opération(s)` },
    { label: "Total retraits", value: totals.withdrawalAmount, hint: `${totals.withdrawalCount} opération(s)` },
    {
      label: "Total frais",
      value: totals.totalFees,
      hint: `Transferts ${fmt(totals.transferFees)} · Retraits ${fmt(totals.withdrawalFees)}`,
      accent: true,
    },
  ];
  return (
    <div className="surface grid gap-px overflow-hidden rounded-xl bg-line p-0 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col gap-2 bg-surface px-5 py-4">
          <span className="mono-label truncate text-muted-foreground">{s.label}</span>
          <p
            className={cn(
              "num font-display truncate text-[1.375rem] leading-none font-semibold",
              s.accent ? "text-primary" : "text-foreground",
            )}
          >
            {fmt(s.value)}
          </p>
          <p className="truncate text-xs text-muted-foreground">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}
