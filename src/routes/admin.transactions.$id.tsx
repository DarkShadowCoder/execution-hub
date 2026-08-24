import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, X, Ban, UserPlus, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

import {
  getTransaction,
  decideTransaction,
  uploadExecutionProof,
  assignTransaction,
  listPartners,
} from "@/lib/admin.functions";
import { PageHeader, StatusPill, Field, EmptyState } from "@/components/admin/ui-bits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { money, dateTime, label, TX_TYPE_LABELS } from "@/lib/format";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(url ?? "");
}

function ProofPreview({ url, caption }: { url: string; caption?: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-lg border border-border bg-muted/30 transition hover:border-primary/50"
    >
      {isImageUrl(url) ? (
        <img
          src={url}
          alt={caption || "Preuve de transaction"}
          loading="lazy"
          className="h-48 w-full bg-background object-contain transition group-hover:scale-[1.01]"
        />
      ) : (
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-5" /> Ouvrir le fichier
        </div>
      )}
      <p className="truncate border-t border-border px-3 py-2 text-xs text-muted-foreground">{caption || url}</p>
    </a>
  );
}


export const Route = createFileRoute("/admin/transactions/$id")({
  head: () => ({
    meta: [
      { title: "Détail transaction — Admin Zender237" },
      {
        name: "description",
        content: "Examen d'une transaction Zender237 : preuves, décision, affectation partenaire et historique.",
      },
      { property: "og:title", content: "Détail transaction — Admin Zender237" },
      { property: "og:description", content: "Preuves, décision et affectation d'une transaction Zender237." },
    ],
  }),
  component: TransactionDetail,
});

function TransactionDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchTx = useServerFn(getTransaction);
  const fetchPartners = useServerFn(listPartners);
  const decide = useServerFn(decideTransaction);
  const uploadProof = useServerFn(uploadExecutionProof);
  const assign = useServerFn(assignTransaction);

  const [reason, setReason] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [responsibility, setResponsibility] = useState("execution");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isPending } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetchTx({ data: { id } }),
  });
  const partners = useQuery({ queryKey: ["partners"], queryFn: () => fetchPartners() });

  const refresh = () => qc.invalidateQueries({ queryKey: ["transaction", id] });

  const decideMut = useMutation({
    mutationFn: (status: string) => decide({ data: { id, status, reason: reason || undefined } }),
    onSuccess: () => {
      toast.success("Décision enregistrée");
      setReason("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pickFile = (file: File | null) => {
    setProofFile(file);
    setProofPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    });
  };

  const proofMut = useMutation({
    mutationFn: async () => {
      if (!proofFile) throw new Error("Aucun fichier sélectionné");
      if (proofFile.size > 10 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 10 Mo)");
      const buf = new Uint8Array(await proofFile.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 8192) {
        bin += String.fromCharCode(...buf.subarray(i, i + 8192));
      }
      return uploadProof({
        data: {
          id,
          fileName: proofFile.name,
          contentType: proofFile.type || "application/octet-stream",
          dataBase64: btoa(bin),
          description: proofNote || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("Preuve d'exécution ajoutée");
      pickFile(null);
      setProofNote("");
      if (fileRef.current) fileRef.current.value = "";
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const assignMut = useMutation({
    mutationFn: () => assign({ data: { id, partnerId, responsibility } }),
    onSuccess: () => {
      toast.success("Transaction affectée");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState message="Transaction introuvable." />;

  const tx = data.tx;

  return (
    <div className="reveal space-y-8">
      <Link to="/admin/transactions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Retour aux transactions
      </Link>

      <PageHeader
        title={`${label(TX_TYPE_LABELS, tx.type)} · ${money(tx.amount)}`}
        subtitle={`Créée le ${dateTime(tx.created_at)}`}
        actions={<StatusPill status={tx.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="grid gap-4 p-4 sm:grid-cols-3">
            <Field label="Montant" value={money(tx.amount)} />
            <Field label="Frais" value={money(tx.fee_amount)} />
            <Field label="Étape" value={String(tx.workflow_stage ?? "—")} />
            <Field label="Expéditeur" value={tx.sender_name ?? data.profile?.username ?? "—"} />
            <Field label="Téléphone expéditeur" value={tx.sender_phone_number ?? "—"} />
            <Field label="Pays destinataire" value={tx.recipient_country ?? "—"} />
            <Field label="Bénéficiaire" value={tx.recipient_name ?? "—"} />
            <Field label="Numéro bénéficiaire" value={tx.recipient_mobile_number ?? "—"} />
            <Field label="Numéro MoMo dépôt" value={data.momo ? `${data.momo.holder_name} · ${data.momo.phone_number}` : "—"} />
            <Field
              label="Client"
              value={
                data.profile ? (
                  <Link to="/admin/users/$id" params={{ id: data.profile.id }} className="text-primary hover:underline">
                    {data.profile.username}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Confirmée le" value={dateTime(tx.confirmed_at)} />
            <Field label="Motif de rejet" value={tx.rejection_reason ?? "—"} />
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="section-title">Preuves du client</h2>
            {data.proofs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune preuve envoyée.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.proofs.map((p: any) => (
                  <ProofPreview key={p.id} url={p.file_url} caption={p.file_name} />
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="section-title">Preuves d'exécution</h2>
            {data.execProofs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune preuve d'exécution enregistrée.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.execProofs.map((p: any) => (
                  <ProofPreview
                    key={p.id}
                    url={p.file_url}
                    caption={`${p.description ?? "Preuve d'exécution"} · ${dateTime(p.uploaded_at ?? p.created_at)}`}
                  />
                ))}
              </div>
            )}
            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-4" />
                  {proofFile ? proofFile.name : "Choisir un fichier…"}
                </Button>
                <span className="text-xs text-muted-foreground">Image ou PDF · 10 Mo max</span>
              </div>
              {proofPreview ? (
                <img
                  src={proofPreview}
                  alt="Aperçu de la preuve d'exécution"
                  className="max-h-48 rounded-lg border border-border bg-muted/30 object-contain"
                />
              ) : null}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Description (optionnel)"
                />
                <Button disabled={!proofFile || proofMut.isPending} onClick={() => proofMut.mutate()}>
                  Ajouter
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="section-title">Historique</h2>
            {data.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun changement de statut.</p>
            ) : (
              <ol className="space-y-2">
                {data.history.map((h: any) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">{dateTime(h.created_at)}</span>
                    <StatusPill status={h.previous_status} />
                    <span className="text-muted-foreground">→</span>
                    <StatusPill status={h.new_status} />
                    {h.reason ? <span className="text-xs text-muted-foreground">({h.reason})</span> : null}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-3 p-4">
            <h2 className="section-title">Décision</h2>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif (obligatoire pour un rejet ou une annulation)"
              rows={3}
            />
            <div className="grid gap-2">
              <Button
                className="gap-1.5"
                disabled={decideMut.isPending}
                onClick={() => decideMut.mutate("under_review")}
              >
                Passer en examen
              </Button>
              <Button
                variant="default"
                className="gap-1.5"
                disabled={decideMut.isPending}
                onClick={() => decideMut.mutate("confirmed")}
              >
                <Check className="size-4" /> Confirmer
              </Button>
              <Button
                variant="destructive"
                className="gap-1.5"
                disabled={decideMut.isPending || !reason}
                onClick={() => decideMut.mutate("rejected")}
              >
                <X className="size-4" /> Rejeter
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={decideMut.isPending || !reason}
                onClick={() => decideMut.mutate("cancelled")}
              >
                <Ban className="size-4" /> Annuler
              </Button>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="section-title">Affectation partenaire</h2>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choisir un partenaire…</option>
              {(partners.data?.rows ?? [])
                .filter((p: any) => p.active)
                .map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>
            <select
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="execution">Exécution</option>
              <option value="collection">Collecte</option>
              <option value="delivery">Remise</option>
            </select>
            <Button className="w-full gap-1.5" disabled={!partnerId || assignMut.isPending} onClick={() => assignMut.mutate()}>
              <UserPlus className="size-4" /> Affecter
            </Button>
            {data.assignments.length > 0 ? (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {data.assignments.map((a: any) => (
                  <li key={a.id}>
                    {a.responsibility} · {a.status} · {dateTime(a.assigned_at ?? a.created_at)}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
