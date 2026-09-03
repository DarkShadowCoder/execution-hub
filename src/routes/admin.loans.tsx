import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Banknote, HandCoins, PiggyBank, TriangleAlert } from "lucide-react";

import {
  listLoans,
  approveLoanRequest,
  rejectLoanRequest,
  updateLoanRequestStatus,
  disburseLoan,
  recordLoanRepayment,
  markLoanDefaulted,
} from "@/lib/admin.functions";
import { PageHeader, KpiCard, StatusPill, EmptyState } from "@/components/admin/ui-bits";
import { DataTable } from "@/components/admin/data-table";
import { DateRangeFilter, EMPTY_RANGE, type DateRange } from "@/components/admin/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { money, dateTime, dateOnly, label, LOAN_STATUS_LABELS, LOAN_TYPE_LABELS } from "@/lib/format";

export const Route = createFileRoute("/admin/loans")({
  head: () => ({
    meta: [
      { title: "Prêts — Admin Zender237" },
      {
        name: "description",
        content:
          "Traitement des demandes de prêt Zender237 : approbation, décaissement, échéanciers et remboursements.",
      },
      { property: "og:title", content: "Prêts — Admin Zender237" },
      {
        property: "og:description",
        content: "Demandes de prêt, décaissements et remboursements Zender237.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoansPage,
});

type Dialogs =
  | { kind: "approve"; row: any }
  | { kind: "reject"; row: any }
  | { kind: "disburse"; row: any }
  | { kind: "repay"; row: any }
  | null;

function LoansPage() {
  const qc = useQueryClient();
  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const fetchLoans = useServerFn(listLoans);
  const { data, isPending } = useQuery({
    queryKey: ["loans", range.from, range.to],
    queryFn: () => fetchLoans({ data: { from: range.from, to: range.to } }),
  });

  const approve = useServerFn(approveLoanRequest);
  const reject = useServerFn(rejectLoanRequest);
  const updateStatus = useServerFn(updateLoanRequestStatus);
  const disburse = useServerFn(disburseLoan);
  const repay = useServerFn(recordLoanRepayment);
  const defaulted = useServerFn(markLoanDefaulted);

  const run = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      setDialog(null);
      toast.success("Opération effectuée");
    },
    onError: (e: unknown) => toast.error((e as Error)?.message ?? "Échec de l'opération"),
  });

  const kpis = data?.kpis;
  const requests = (data?.requests ?? []) as any[];
  const loans = (data?.loans ?? []) as any[];
  const installments = (data?.installments ?? []) as any[];
  const repayments = (data?.repayments ?? []) as any[];

  const selected = useMemo(() => loans.find((l) => l.id === detail) ?? null, [loans, detail]);
  const selectedInstallments = useMemo(
    () => installments.filter((i) => i.loan_id === detail),
    [installments, detail],
  );
  const selectedRepayments = useMemo(
    () => repayments.filter((r) => r.loan_id === detail),
    [repayments, detail],
  );

  return (
    <div className="reveal space-y-8">
      <PageHeader title="Prêts" subtitle="Demandes, décaissements et remboursements" />

      <DateRangeFilter value={range} onChange={setRange} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Demandes à traiter"
          value={(kpis?.submitted ?? 0) + (kpis?.contacted ?? 0)}
          hint={`${kpis?.submitted ?? 0} nouvelles · ${kpis?.contacted ?? 0} en cours`}
          tone="warning"
          icon={<HandCoins className="size-4" />}
        />
        <KpiCard
          title="Montant décaissé"
          value={money(kpis?.disbursedAmount ?? 0)}
          hint={`${kpis?.activeLoans ?? 0} prêts actifs`}
          tone="success"
          icon={<Banknote className="size-4" />}
        />
        <KpiCard
          title="Encours restant"
          value={money(kpis?.outstanding ?? 0)}
          hint={`${money(kpis?.repaid ?? 0)} remboursés`}
          icon={<PiggyBank className="size-4" />}
        />
        <KpiCard
          title="Défauts"
          value={kpis?.defaulted ?? 0}
          hint={`Frais de service : ${money(kpis?.fees ?? 0)}`}
          tone="danger"
          icon={<TriangleAlert className="size-4" />}
        />
      </div>

      <section className="space-y-3">
        <h2 className="section-title block">Demandes de prêt</h2>
        <DataTable
          loading={isPending}
          rows={requests}
          searchable
          paginated
          searchPlaceholder="Rechercher un demandeur, un téléphone…"
          empty="Aucune demande de prêt."
          filters={[
            {
              key: "status",
              label: "Statut",
              options: Object.entries(LOAN_STATUS_LABELS).map(([value, l]) => ({ value, label: l })),
              predicate: (r: any, v) => r.status === v,
            },
            {
              key: "type",
              label: "Type",
              options: Object.entries(LOAN_TYPE_LABELS).map(([value, l]) => ({ value, label: l })),
              predicate: (r: any, v) => r.loan_type === v,
            },
          ]}
          columns={[
            {
              key: "user",
              header: "Demandeur",
              value: (r: any) => `${r.full_name} ${r.whatsapp_number ?? ""} ${r.user?.username ?? ""}`,
              render: (r: any) => (
                <div className="min-w-0">
                  <Link
                    to="/admin/users/$id"
                    params={{ id: r.user_id }}
                    className="block truncate font-medium text-foreground hover:text-primary"
                  >
                    {r.full_name}
                  </Link>
                  <span className="num text-xs text-muted-foreground">{r.whatsapp_number}</span>
                </div>
              ),
            },
            {
              key: "loan_type",
              header: "Type",
              render: (r: any) => label(LOAN_TYPE_LABELS, r.loan_type),
            },
            { key: "amount", header: "Montant", align: "right", render: (r: any) => money(r.amount) },
            {
              key: "rank_at_request",
              header: "Rang",
              render: (r: any) => (
                <span className="mono-label text-foreground/70">{r.rank_at_request}</span>
              ),
            },
            {
              key: "repayment_months",
              header: "Durée",
              align: "right",
              render: (r: any) => `${r.repayment_months} mois`,
            },
            {
              key: "status",
              header: "Statut",
              render: (r: any) => <StatusPill status={r.status} />,
            },
            {
              key: "submitted_at",
              header: "Soumise",
              render: (r: any) => dateTime(r.submitted_at),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (r: any) => {
                const open = !["approved", "rejected", "cancelled", "completed"].includes(r.status);
                if (!open) return <span className="text-xs text-muted-foreground">—</span>;
                return (
                  <div className="flex justify-end gap-1.5">
                    {r.status === "submitted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          run.mutate(() =>
                            updateStatus({ data: { requestId: r.id, status: "contacted" } }),
                          )
                        }
                      >
                        Contacter
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setDialog({ kind: "approve", row: r })}>
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDialog({ kind: "reject", row: r })}
                    >
                      Rejeter
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="section-title block">Prêts accordés</h2>
        <DataTable
          loading={isPending}
          rows={loans}
          searchable
          paginated
          searchPlaceholder="Rechercher un prêt…"
          empty="Aucun prêt accordé."
          columns={[
            {
              key: "user",
              header: "Client",
              value: (r: any) => r.user?.username ?? r.user_id,
              render: (r: any) => (
                <Link
                  to="/admin/users/$id"
                  params={{ id: r.user_id }}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {r.user?.username ?? r.user_id.slice(0, 8)}
                </Link>
              ),
            },
            {
              key: "loan_type",
              header: "Type",
              render: (r: any) => label(LOAN_TYPE_LABELS, r.loan_type),
            },
            {
              key: "approved_amount",
              header: "Accordé",
              align: "right",
              render: (r: any) => money(r.approved_amount),
            },
            {
              key: "total_due",
              header: "Total dû",
              align: "right",
              render: (r: any) => money(r.total_due),
            },
            {
              key: "outstanding_amount",
              header: "Encours",
              align: "right",
              render: (r: any) => money(r.outstanding_amount),
            },
            { key: "status", header: "Statut", render: (r: any) => <StatusPill status={r.status} /> },
            {
              key: "disbursement_status",
              header: "Décaissement",
              render: (r: any) => (
                <span className="text-xs text-muted-foreground">
                  {label(LOAN_STATUS_LABELS, r.disbursement_status)}
                </span>
              ),
            },
            {
              key: "maturity_date",
              header: "Échéance",
              render: (r: any) => dateOnly(r.maturity_date),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (r: any) => (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => setDetail(r.id)}>
                    Détail
                  </Button>
                  {r.disbursement_status !== "completed" && (
                    <Button size="sm" onClick={() => setDialog({ kind: "disburse", row: r })}>
                      Décaisser
                    </Button>
                  )}
                  {Number(r.outstanding_amount) > 0 && r.disbursement_status === "completed" && (
                    <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "repay", row: r })}>
                      Remboursement
                    </Button>
                  )}
                  {r.status !== "defaulted" && r.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => run.mutate(() => defaulted({ data: { loanId: r.id } }))}
                    >
                      Défaut
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </section>

      <ApproveDialog
        open={dialog?.kind === "approve"}
        row={dialog?.kind === "approve" ? dialog.row : null}
        pending={run.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(amount, fee, notes) =>
          run.mutate(() =>
            approve({
              data: {
                requestId: dialog!.row.id,
                approvedAmount: amount,
                serviceFee: fee,
                notes: notes || undefined,
              },
            }),
          )
        }
      />

      <ReasonDialog
        open={dialog?.kind === "reject"}
        title="Rejeter la demande"
        description="Le motif est transmis au client."
        pending={run.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(reason) =>
          run.mutate(() => reject({ data: { requestId: dialog!.row.id, reason } }))
        }
      />

      <ReasonDialog
        open={dialog?.kind === "disburse"}
        title="Confirmer le décaissement"
        description="Indiquez la référence externe du virement (optionnel)."
        placeholder="Référence du virement"
        required={false}
        pending={run.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(reference) =>
          run.mutate(() =>
            disburse({ data: { loanId: dialog!.row.id, reference: reference || undefined } }),
          )
        }
      />

      <RepaymentDialog
        open={dialog?.kind === "repay"}
        row={dialog?.kind === "repay" ? dialog.row : null}
        pending={run.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(amount, method, reference, note) =>
          run.mutate(() =>
            repay({
              data: {
                loanId: dialog!.row.id,
                amount,
                method,
                reference: reference || undefined,
                note: note || undefined,
              },
            }),
          )
        }
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail du prêt</DialogTitle>
            <DialogDescription>
              {selected ? `${money(selected.approved_amount)} · ${label(LOAN_TYPE_LABELS, selected.loan_type)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-5 overflow-auto">
            <div>
              <h3 className="mono-label mb-2">Échéancier</h3>
              {selectedInstallments.length === 0 ? (
                <EmptyState message="Aucune échéance générée." />
              ) : (
                <Card className="surface divide-y divide-border rounded-xl p-0 shadow-none">
                  {selectedInstallments.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">
                        #{i.installment_number} · {dateOnly(i.due_date)}
                      </span>
                      <span className="num">
                        {money(i.amount_paid)} / {money(i.amount_due)}
                      </span>
                      <StatusPill status={i.status} />
                    </div>
                  ))}
                </Card>
              )}
            </div>
            <div>
              <h3 className="mono-label mb-2">Remboursements</h3>
              {selectedRepayments.length === 0 ? (
                <EmptyState message="Aucun remboursement enregistré." />
              ) : (
                <Card className="surface divide-y divide-border rounded-xl p-0 shadow-none">
                  {selectedRepayments.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{dateTime(r.paid_at)}</span>
                      <span className="text-xs text-muted-foreground">{r.payment_method}</span>
                      <span className="num font-medium">{money(r.amount)}</span>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApproveDialog({
  open,
  row,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  row: any;
  pending: boolean;
  onClose: () => void;
  onSubmit: (amount: number, fee: number, notes: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        if (o && row) {
          setAmount(String(row.amount ?? ""));
          setFee("");
          setNotes("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approuver la demande</DialogTitle>
          <DialogDescription>
            {row ? `${row.full_name} · demande de ${money(row.amount)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="mono-label">Montant accordé</span>
            <Input
              type="number"
              value={amount}
              placeholder={String(row?.amount ?? "")}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="mono-label">Frais de service</span>
            <Input type="number" value={fee} placeholder="0" onChange={(e) => setFee(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="mono-label">Notes internes</span>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={pending}
            onClick={() => onSubmit(Number(amount || row?.amount || 0), Number(fee || 0), notes)}
          >
            Approuver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialog({
  open,
  title,
  description,
  placeholder = "Motif",
  required = true,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setValue("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <Textarea
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={pending || (required && !value.trim())} onClick={() => onSubmit(value.trim())}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RepaymentDialog({
  open,
  row,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  row: any;
  pending: boolean;
  onClose: () => void;
  onSubmit: (amount: number, method: string, reference: string, note: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mobile_money");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else {
          setAmount("");
          setReference("");
          setNote("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un remboursement</DialogTitle>
          <DialogDescription>
            {row ? `Encours actuel : ${money(row.outstanding_amount)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="mono-label">Montant</span>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="mono-label">Méthode</span>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="mono-label">Référence externe</span>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="mono-label">Note</span>
            <Textarea value={note} rows={2} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={pending || !Number(amount)} onClick={() => onSubmit(Number(amount), method, reference, note)}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
