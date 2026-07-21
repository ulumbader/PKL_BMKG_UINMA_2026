"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { Field, FilterPanel, PageHeader, Pagination, controlClass } from "@/components/admin/AdminUI";
import { Alert, Button, Card, Skeleton } from "@/components/ui";
import { ApiError, apiGet } from "@/lib/apiClient";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type Paginated<T> = {
  data?: T[];
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
};

type ListResult<T> = T[] | Paginated<T>;

type LogRow = {
  id: number;
  sumber: string;
  status: string;
  jumlah_data_masuk: number;
  pesan_error?: string | null;
  waktu_mulai?: string;
  waktu_selesai?: string;
  triggered_by?: number;
  triggered_by_user?: { id: number; nama_lengkap: string } | null;
};

type Filters = {
  status: string;
  sumber: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  per_page: string;
};

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const emptyFilters: Filters = {
  status: "",
  sumber: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  per_page: "15",
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function listItems<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result : result.data ?? [];
}

function listTotal<T>(result: ListResult<T>) {
  return Array.isArray(result) ? result.length : result.total ?? result.data?.length ?? 0;
}

function buildQuery(filters: Filters, page: number) {
  const params = new URLSearchParams({ per_page: filters.per_page, page: String(page) });
  if (filters.status) params.set("status", filters.status);
  if (filters.sumber) params.set("sumber", filters.sumber);
  if (filters.tanggal_mulai) params.set("tanggal_mulai", filters.tanggal_mulai);
  if (filters.tanggal_selesai) params.set("tanggal_selesai", filters.tanggal_selesai);
  return params.toString();
}

function errorMessage(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiError)) return fallback;
  return caught.message;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID");
}

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */

export default function Page() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ──────────────── Data Fetching ──────────────── */

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await apiGet<ListResult<LogRow>>(
          `/admin/log-import?${buildQuery(appliedFilters, page)}`,
        );
        if (!active) return;
        setRows(listItems(response.data));
        setTotal(listTotal(response.data));
        setTotalPages(Array.isArray(response.data) ? 1 : response.data.last_page ?? Math.max(1, Math.ceil((response.data.total ?? 0) / (response.data.per_page ?? Number(appliedFilters.per_page)))));
      } catch (caught) {
        if (!active) return;
        setRows([]);
        setTotal(0);
        setTotalPages(1);
        setError(errorMessage(caught, "Log import gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [appliedFilters, page]);

  const submitFilter = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  }, [filters]);

  /* ──────────────── Render ──────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Log Import" description="Tinjau histori proses import data BMKG beserta status dan hasilnya." />

      {error ? <Alert variant="error">{error}</Alert> : null}

      {/* ──────── Filters ──────── */}
      <FilterPanel activeCount={Object.values(appliedFilters).filter(Boolean).length - 1}>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-6">
          <Field label="Status">
            <select
              className={controlClass}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Semua</option>
              <option value="sukses">Sukses</option>
              <option value="gagal">Gagal</option>
            </select>
          </Field>
          <Field label="Sumber">
            <input
              className={controlClass}
              value={filters.sumber}
              onChange={(e) => setFilters({ ...filters, sumber: e.target.value })}
              placeholder="import_csv"
            />
          </Field>
          <Field label="Dari Tanggal">
            <input
              className={controlClass}
              type="date"
              value={filters.tanggal_mulai}
              onChange={(e) => setFilters({ ...filters, tanggal_mulai: e.target.value })}
            />
          </Field>
          <Field label="Sampai Tanggal">
            <input
              className={controlClass}
              type="date"
              value={filters.tanggal_selesai}
              onChange={(e) => setFilters({ ...filters, tanggal_selesai: e.target.value })}
            />
          </Field>
          <Field label="Per Halaman">
            <select
              className={controlClass}
              value={filters.per_page}
              onChange={(e) => setFilters({ ...filters, per_page: e.target.value })}
            >
              <option value="15">15</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1">Filter</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters(emptyFilters);
                setAppliedFilters(emptyFilters);
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </FilterPanel>

      {/* ──────── Table ──────── */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-background text-left text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">ID</th>
                <th scope="col" className="px-4 py-3 font-medium">Sumber</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Data Masuk</th>
                <th scope="col" className="px-4 py-3 font-medium">Pesan Error</th>
                <th scope="col" className="px-4 py-3 font-medium">Mulai</th>
                <th scope="col" className="px-4 py-3 font-medium">Selesai</th>
                <th scope="col" className="px-4 py-3 font-medium">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, ri) => (
                  <tr key={ri} className="border-b border-border">
                    {Array.from({ length: 8 }).map((__, ci) => (
                      <td key={ci} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border transition-colors hover:bg-background/70 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{row.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <code className="rounded bg-background px-1.5 py-0.5 text-xs">{row.sumber}</code>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">{row.jumlah_data_masuk}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-muted">
                      {row.pesan_error || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.waktu_mulai)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.waktu_selesai)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.triggered_by_user?.nama_lengkap ?? `-`}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Belum ada log import sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPageChange={setPage} />
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    sukses: "border-primary/30 bg-success-subtle text-primary",
    gagal: "border-danger/30 bg-danger-subtle text-danger",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium capitalize",
        colors[status || ""] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {status || "-"}
    </span>
  );
}
