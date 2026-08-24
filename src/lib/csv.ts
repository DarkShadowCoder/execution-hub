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
