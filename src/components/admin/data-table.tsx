import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EmptyState } from "@/components/admin/ui-bits";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  /** Valeur texte utilisée par la recherche globale (par défaut : row[key]). */
  value?: (row: T) => string | number | null | undefined;
};

export type TableFilter<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Prédicat appliqué quand une valeur est sélectionnée. */
  predicate: (row: T, value: string) => boolean;
};

const ALL = "__all__";

function textOf<T>(row: T, column: Column<T>) {
  const raw = column.value
    ? column.value(row)
    : (row as Record<string, unknown>)[column.key];
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "object") return JSON.stringify(raw);
  return String(raw);
}

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  loading,
  empty = "Aucune donnée disponible.",
  searchable = false,
  searchPlaceholder = "Rechercher…",
  filters,
  paginated = false,
  pageSize: initialPageSize = 25,
  toolbar,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  loading?: boolean;
  empty?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: TableFilter<T>[];
  paginated?: boolean;
  pageSize?: number;
  toolbar?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);

  const allRows = rows ?? [];

  const filteredRows = useMemo(() => {
    let result = allRows;

    if (filters?.length) {
      for (const filter of filters) {
        const value = filterValues[filter.key];
        if (value && value !== ALL) {
          result = result.filter((row) => filter.predicate(row, value));
        }
      }
    }

    const term = search.trim().toLowerCase();
    if (searchable && term) {
      result = result.filter((row) =>
        columns.some((column) => textOf(row, column).toLowerCase().includes(term)),
      );
    }

    return result;
  }, [allRows, columns, filterValues, filters, search, searchable]);

  const total = filteredRows.length;
  const pageCount = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const currentPage = Math.min(page, pageCount);
  const visibleRows = paginated
    ? filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredRows;

  const hasToolbar = searchable || !!filters?.length || !!toolbar;

  return (
    <div className="space-y-4">
      {hasToolbar && (
        <div className="surface flex flex-wrap items-center gap-2 rounded-xl p-2.5">
          {searchable && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {filters?.map((filter) => (
            <Select
              key={filter.key}
              value={filterValues[filter.key] ?? ALL}
              onValueChange={(value) => {
                setFilterValues((prev) => ({ ...prev, [filter.key]: value }));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{filter.label} : tous</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {toolbar ? <div className="ml-auto flex items-center gap-2">{toolbar}</div> : null}
        </div>
      )}

      <Card className="surface overflow-hidden rounded-xl p-0 shadow-none">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="ml-auto h-4 w-1/5" />
              </div>
            ))}
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState message={total === 0 && allRows.length > 0 ? "Aucun résultat pour ces critères." : empty} />
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-raised/85 text-left backdrop-blur">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "mono-label border-b border-border px-5 py-3 whitespace-nowrap",
                        c.align === "right" && "text-right",
                      )}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {visibleRows.map((row, i) => (
                  <tr key={(row.id as string) ?? i} className="transition-colors hover:bg-primary/[0.04]">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-5 py-3.5 align-middle",
                          c.align === "right" && "num text-right",
                        )}
                      >
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {paginated && !loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Lignes par page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} sur {total}
            </span>
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={currentPage <= 1}
                  className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 text-xs text-muted-foreground">
                  Page {currentPage} / {pageCount}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={currentPage >= pageCount}
                  className={cn(currentPage >= pageCount && "pointer-events-none opacity-50")}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(pageCount, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
