import type { ReactNode } from "react";
import { ChevronRight, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TX_STATUS_LABELS, label } from "@/lib/format";

const STATUS_TONE: Record<string, { pill: string; dot: string }> = {
  confirmed: { pill: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  completed: { pill: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  executed: { pill: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  approved: { pill: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  active: { pill: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  rejected: {
    pill: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  failed: {
    pill: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  cancelled: { pill: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  under_review: { pill: "bg-warning/12 text-warning border-warning/25", dot: "bg-warning" },
  pending_proof: { pill: "bg-warning/12 text-warning border-warning/25", dot: "bg-warning" },
  pending: { pill: "bg-warning/12 text-warning border-warning/25", dot: "bg-warning" },
};

export function StatusPill({ status, className }: { status: unknown; className?: string }) {
  const key = String(status ?? "");
  const tone = STATUS_TONE[key] ?? {
    pill: "bg-secondary text-secondary-foreground border-border",
    dot: "bg-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden />
      {label(TX_STATUS_LABELS, key) || "—"}
    </span>
  );
}

export function KpiCard({
  title,
  value,
  hint,
  icon,
  trend,
  tone = "default",
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  trend?: { value: string; direction?: "up" | "down" | "flat" };
  tone?: "default" | "warning" | "success" | "danger";
}) {
  const toneRing =
    tone === "warning"
      ? "text-warning bg-warning/10"
      : tone === "success"
        ? "text-success bg-success/10"
        : tone === "danger"
          ? "text-destructive bg-destructive/10"
          : "text-primary bg-primary/10";
  const trendTone =
    trend?.direction === "down"
      ? "text-destructive bg-destructive/10"
      : trend?.direction === "up"
        ? "text-success bg-success/10"
        : "text-muted-foreground bg-muted";
  return (
    <Card className="surface group gap-0 rounded-xl p-4 shadow-none transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-center gap-3">
        {icon ? (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", toneRing)}>
            {icon}
          </span>
        ) : null}
        <p className="mono-label truncate">{title}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
        <p className="num font-display truncate text-[1.375rem] leading-none font-semibold text-foreground">
          {value}
        </p>
        {trend ? (
          <span
            className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", trendTone)}
          >
            {trend.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; to?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        {breadcrumb?.length ? (
          <nav className="mono-label mb-2 flex flex-wrap items-center gap-1">
            {breadcrumb.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="size-3" aria-hidden /> : null}
                {crumb.to ? (
                  <Link to={crumb.to} className="transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground/70">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="font-display text-[1.6rem] leading-tight font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-5" />}
      </span>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function Field({ label: l, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border-l-2 border-primary/40 bg-raised/60 px-3 py-2">
      <p className="mono-label">{l}</p>
      <p className="text-sm font-medium break-words text-foreground">{value ?? "—"}</p>
    </div>
  );
}
