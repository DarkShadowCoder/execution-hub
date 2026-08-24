function escapeCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
  const clean = raw.replace(/\r?\n/g, " ").trim();
  return /[",;]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
}

export type CsvColumn<T> = { header: string; value: (row: T) => unknown };

export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]) {
  const lines = [columns.map((c) => escapeCell(c.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(c.value(row))).join(","));
  }
  return lines.join("\r\n");
}

export function downloadCsv<T>(baseName: string, columns: CsvColumn<T>[], rows: T[]) {
  const date = new Date().toISOString().slice(0, 10);
  const csv = "\uFEFF" + toCsv(columns, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseName}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Parse a CSV/TSV/semicolon text into rows of trimmed cells. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const header = clean.split("\n")[0] ?? "";
  const delim = header.includes(";") ? ";" : header.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!;
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

/** "10 001,00 FCFA" | "10,001.00 FCFA" | "-" -> number */
export function parseAmount(raw: string): number {
  const s = (raw ?? "").replace(/FCFA|XAF|GNF|\s|\u00a0/gi, "");
  if (!s || s === "-" || s === "–") return 0;
  let n = s.replace(/[^0-9,.\-]/g, "");
  if (n.includes(",") && n.includes(".")) n = n.replace(/,/g, "");
  else if (n.includes(",")) n = n.replace(",", ".");
  const value = Number(n);
  return Number.isFinite(value) ? value : NaN;
}
