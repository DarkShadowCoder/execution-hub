export function money(value: unknown, currency = "XAF") {
  const n = Number(value ?? 0);
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${currency}`;
}

export function dateTime(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateOnly(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export const TX_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  pending_proof: "Preuve attendue",
  under_review: "En examen",
  assigned: "Affectée",
  executing: "En exécution",
  confirmed: "Confirmée",
  rejected: "Rejetée",
  cancelled: "Annulée",
  completed: "Terminée",
  failed: "Échouée",
};

export const TX_TYPE_LABELS: Record<string, string> = {
  deposit: "Dépôt",
  transfer: "Transfert",
  withdrawal: "Retrait",
};

export function label(map: Record<string, string>, key: unknown) {
  const k = String(key ?? "");
  return map[k] ?? k.replace(/_/g, " ") ?? "—";
}
