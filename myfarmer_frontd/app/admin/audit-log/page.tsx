"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";

import { Field, FilterPanel, PageHeader, Pagination, controlClass } from "@/components/admin/AdminUI";
import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
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

type AuditRow = {
  id: number;
  user_id: number;
  aksi: string;
  tabel_terkait: string;
  id_terkait?: number | null;
  detail?: Record<string, unknown> | null;
  ip_address?: string;
  created_at?: string;
  user?: { id: number; nama_lengkap: string; email: string } | null;
};

type UserOption = {
  id: number;
  nama_lengkap: string;
  email: string;
};

type Filters = {
  user_id: string;
  tabel_terkait: string;
  aksi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  per_page: string;
};

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const tabelTerkaitOptions = [
  "data_iklim_harian",
  "rule_rekomendasi",
  "konten_landing_page",
  "ringkasan_ai",
];

const emptyFilters: Filters = {
  user_id: "",
  tabel_terkait: "",
  aksi: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  per_page: "20",
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
  if (filters.user_id) params.set("user_id", filters.user_id);
  if (filters.tabel_terkait) params.set("tabel_terkait", filters.tabel_terkait);
  if (filters.aksi) params.set("aksi", filters.aksi);
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
  const { nama_role, isReady } = useAuth();

  /* ── Role gate ── */
  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" label="Memuat" />
      </div>
    );
  }

  if (nama_role !== "super_admin") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <Alert variant="error">
          Anda tidak memiliki izin untuk mengakses halaman ini. Hanya <strong>super admin</strong> yang dapat melihat audit log.
        </Alert>
      </div>
    );
  }

  return <AuditLogContent />;
}

/* ────────────────────────────────────────────
   Audit Log Content (only rendered for super_admin)
   ──────────────────────────────────────────── */

function AuditLogContent() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  /* ──────────────── Fetch user options ──────────────── */

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setUsersLoading(true);
      try {
        const response = await apiGet<ListResult<UserOption>>("/admin/users");
        if (!active) return;
        setUserOptions(listItems(response.data));
      } catch {
        if (!active) return;
        setUserOptions([]);
      } finally {
        if (active) setUsersLoading(false);
      }
    }

    loadUsers();
    return () => { active = false; };
  }, []);

  /* ──────────────── Data Fetching ──────────────── */

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await apiGet<ListResult<AuditRow>>(
          `/admin/audit-log?${buildQuery(appliedFilters, page)}`,
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
        setError(errorMessage(caught, "Audit log gagal dimuat."));
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

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* ──────────────── Render ──────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Audit Log" description="Tinjau jejak aktivitas admin yang dicatat otomatis oleh sistem. Akses khusus Super Admin." />

      {error ? <Alert variant="error">{error}</Alert> : null}

      {/* ──────── Filters ──────── */}
      <FilterPanel activeCount={Object.values(appliedFilters).filter(Boolean).length - 1}>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Field label="User">
            <select
              className={controlClass}
              disabled={usersLoading}
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
            >
              <option value="">{usersLoading ? "Memuat user..." : "Semua"}</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama_lengkap} ({u.email})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tabel Terkait">
            <select
              className={controlClass}
              value={filters.tabel_terkait}
              onChange={(e) => setFilters({ ...filters, tabel_terkait: e.target.value })}
            >
              <option value="">Semua</option>
              {tabelTerkaitOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Aksi">
            <select
              className={controlClass}
              value={filters.aksi}
              onChange={(e) => setFilters({ ...filters, aksi: e.target.value })}
            >
              <option value="">Semua</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
            </select>
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
              <option value="20">20</option>
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
                <th scope="col" className="w-10 px-4 py-3 font-medium"><span className="sr-only">Detail</span></th>
                <th scope="col" className="px-4 py-3 font-medium">ID</th>
                <th scope="col" className="px-4 py-3 font-medium">User</th>
                <th scope="col" className="px-4 py-3 font-medium">Aksi</th>
                <th scope="col" className="px-4 py-3 font-medium">Tabel</th>
                <th scope="col" className="px-4 py-3 font-medium">ID Terkait</th>
                <th scope="col" className="px-4 py-3 font-medium">IP</th>
                <th scope="col" className="px-4 py-3 font-medium">Waktu</th>
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
                rows.map((row) => {
                  const isExpanded = expandedIds.has(row.id);
                  const hasDetail = row.detail && Object.keys(row.detail).length > 0;

                  return (
                    <RowGroup key={row.id}>
                      <tr
                        className={[
                          "border-b border-border",
                          hasDetail ? "hover:bg-background/60" : "",
                          isExpanded ? "bg-background/40" : "",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 text-center">
                          {hasDetail ? (
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label={`${isExpanded ? "Tutup" : "Buka"} detail audit ${row.id}`}
                              onClick={() => toggleExpand(row.id)}
                              className={[
                                "inline-flex size-7 items-center justify-center rounded-control text-xs text-muted transition-transform hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                                isExpanded ? "rotate-90" : "",
                              ].join(" ")}
                            >
                              ▶
                            </button>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{row.id}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {row.user ? (
                            <span>
                              <span className="font-medium">{row.user.nama_lengkap}</span>
                              <span className="ml-1 text-xs text-muted">#{row.user_id}</span>
                            </span>
                          ) : (
                            `User #${row.user_id}`
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <AksiBadge aksi={row.aksi} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <code className="rounded bg-background px-1.5 py-0.5 text-xs">{row.tabel_terkait}</code>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{row.id_terkait ?? "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                          {row.ip_address ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.created_at)}</td>
                      </tr>

                      {/* ── Expandable Detail Row ── */}
                      {isExpanded && hasDetail ? (
                        <tr className="border-b border-border bg-background/30">
                          <td colSpan={8} className="px-6 py-4">
                            <DetailView detail={row.detail!} />
                          </td>
                        </tr>
                      ) : null}
                    </RowGroup>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Belum ada audit log sesuai filter.
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

function RowGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function AksiBadge({ aksi }: { aksi?: string }) {
  const colors: Record<string, string> = {
    created: "border-primary/30 bg-success-subtle text-primary",
    updated: "border-wait/30 bg-warning-subtle text-wait",
    deleted: "border-danger/30 bg-danger-subtle text-danger",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium capitalize",
        colors[aksi || ""] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {aksi || "-"}
    </span>
  );
}

/* ── Detail View: renders before/after in a readable format ── */

function DetailView({ detail }: { detail: Record<string, unknown> }) {
  const sections = Object.entries(detail);

  if (sections.length === 0) {
    return <p className="text-sm text-muted">Tidak ada detail.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Detail Perubahan</p>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([key, value]) => (
          <div key={key} className="rounded-control border border-border bg-surface p-3">
            <p className="mb-2 text-xs font-semibold capitalize text-muted">
              {key === "old" ? "🔴 Sebelum (old)" : key === "new" ? "🟢 Sesudah (new)" : key}
            </p>
            {value && typeof value === "object" && !Array.isArray(value) ? (
              <dl className="space-y-1">
                {Object.entries(value as Record<string, unknown>).map(([field, val]) => (
                  <div key={field} className="flex gap-2 text-sm">
                    <dt className="shrink-0 font-medium text-muted">{field}:</dt>
                    <dd className="break-all text-foreground">
                      {val === null ? (
                        <span className="italic text-muted">null</span>
                      ) : typeof val === "boolean" ? (
                        String(val)
                      ) : (
                        String(val)
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-foreground">
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
