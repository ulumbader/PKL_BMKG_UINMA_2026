"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { ConfirmDialog, EmptyState, Field, FilterPanel, PageHeader, Pagination, StatusBadge, ToastNotice, controlClass, textareaClass } from "@/components/admin/AdminUI";
import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";

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

type KontenRow = {
  id: number;
  judul: string;
  isi: string;
  tipe: "pengumuman" | "tips" | string;
  is_active: boolean;
  urutan_tampil: number;
  dibuat_oleh?: number;
  created_at?: string;
  updated_at?: string;
};

type FieldErrors = Record<string, string>;

type Filters = {
  tipe: string;
  is_active: string;
  per_page: string;
};

type FormData = {
  judul: string;
  isi: string;
  tipe: string;
  is_active: boolean;
  urutan_tampil: string;
};

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const emptyFilters: Filters = { tipe: "", is_active: "", per_page: "15" };

const emptyForm: FormData = {
  judul: "",
  isi: "",
  tipe: "pengumuman",
  is_active: true,
  urutan_tampil: "0",
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
  if (filters.tipe) params.set("tipe", filters.tipe);
  if (filters.is_active) params.set("is_active", filters.is_active);
  return params.toString();
}

function fieldErrors(errors: unknown): FieldErrors {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return {};
  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String).join(" ") : String(value),
    ]),
  );
}

function errorMessage(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiError)) return fallback;
  if (caught.statusCode === 403) return "Aksi ini tidak diizinkan untuk user saat ini.";
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
  /* ── Filter state ── */
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [reloadKey, setReloadKey] = useState(0);

  /* ── Table state ── */
  const [rows, setRows] = useState<KontenRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  /* ── Alerts ── */
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  /* ── Form state (create / edit) ── */
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  /* ── Delete state ── */
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<KontenRow | null>(null);

  /* ──────────────── Data Fetching ──────────────── */

  useEffect(() => {
    let active = true;
    async function loadRows() {
      setLoading(true);
      setError("");
      try {
        const response = await apiGet<ListResult<KontenRow>>(
          `/admin/konten?${buildQuery(appliedFilters, page)}`,
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
        setError(errorMessage(caught, "Data konten gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRows();
    return () => { active = false; };
  }, [appliedFilters, page, reloadKey]);

  /* ──────────────── Filter ──────────────── */

  const submitFilter = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setPage(1);
    setAppliedFilters(filters);
  }, [filters]);

  /* ──────────────── Create / Edit ──────────────── */

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
    setNotice("");
    setError("");
  }

  function openEdit(row: KontenRow) {
    setEditingId(row.id);
    setForm({
      judul: row.judul,
      isi: row.isi,
      tipe: row.tipe,
      is_active: row.is_active,
      urutan_tampil: String(row.urutan_tampil),
    });
    setFormErrors({});
    setShowForm(true);
    setNotice("");
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setFormErrors({});
    setSaving(true);

    const body = {
      judul: form.judul,
      isi: form.isi,
      tipe: form.tipe,
      is_active: form.is_active,
      urutan_tampil: Number(form.urutan_tampil) || 0,
    };

    try {
      if (editingId) {
        const response = await apiPut<KontenRow>(`/admin/konten/${editingId}`, body);
        setNotice(response.message);
      } else {
        const response = await apiPost<KontenRow>("/admin/konten", body);
        setNotice(response.message);
      }
      closeForm();
      setReloadKey((v) => v + 1);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFormErrors(fieldErrors(caught.errors));
        setError(caught.message);
      } else {
        setError(editingId ? "Gagal memperbarui konten." : "Gagal membuat konten.");
      }
    } finally {
      setSaving(false);
    }
  }

  /* ──────────────── Delete ──────────────── */

  async function confirmDelete(id: number) {
    setNotice("");
    setError("");
    setDeletingId(id);

    try {
      const response = await apiDelete<null>(`/admin/konten/${id}`);
      setNotice(response.message);
      setPendingDelete(null);
      setReloadKey((v) => v + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Gagal menghapus konten."));
    } finally {
      setDeletingId(null);
    }
  }

  /* ──────────────── Render ──────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Konten Landing Page" description="Kelola pengumuman dan tips yang ditampilkan pada halaman publik." action={<Button onClick={openCreate}>Buat Konten Baru</Button>} />

      {/* Alerts */}
      <ToastNotice message={notice} onDismiss={() => setNotice("")} />
      {error && !showForm ? <Alert variant="error">{error}</Alert> : null}

      {/* ──────── Create / Edit Form ──────── */}
      {showForm ? (
        <Card>
          <form onSubmit={submitForm} className="space-y-4">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Konten" : "Buat Konten Baru"}
            </h2>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Field label="Judul" error={formErrors.judul}>
              <input
                className={controlClass}
                required
                maxLength={255}
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Judul konten"
              />
            </Field>

            <Field label="Isi" error={formErrors.isi}>
              <textarea
                className={textareaClass}
                required
                rows={5}
                minLength={10}
                value={form.isi}
                onChange={(e) => setForm({ ...form, isi: e.target.value })}
                placeholder="Isi konten (minimal 10 karakter)"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Tipe" error={formErrors.tipe}>
                <select
                  className={controlClass}
                  required
                  value={form.tipe}
                  onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                >
                  <option value="pengumuman">Pengumuman</option>
                  <option value="tips">Tips</option>
                </select>
              </Field>

              <Field label="Urutan Tampil" error={formErrors.urutan_tampil}>
                <input
                  className={controlClass}
                  type="number"
                  min="0"
                  value={form.urutan_tampil}
                  onChange={(e) => setForm({ ...form, urutan_tampil: e.target.value })}
                />
              </Field>

              <Field label="Status Aktif">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_active}
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={[
                    "relative mt-1 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                    form.is_active
                      ? "border-primary bg-primary"
                      : "border-border bg-muted/20",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block size-5 rounded-full bg-white transition-transform",
                      form.is_active ? "translate-x-6" : "translate-x-0.5",
                    ].join(" ")}
                  />
                </button>
                <span className="ml-2 text-sm text-muted">
                  {form.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </Field>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner className="mr-2 size-4" label="Menyimpan" /> : null}
                {editingId ? "Simpan Perubahan" : "Buat Konten"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* ──────── Filters ──────── */}
      <FilterPanel activeCount={Number(Boolean(appliedFilters.tipe)) + Number(Boolean(appliedFilters.is_active))}>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-4">
          <Field label="Tipe">
            <select
              className={controlClass}
              value={filters.tipe}
              onChange={(e) => setFilters({ ...filters, tipe: e.target.value })}
            >
              <option value="">Semua</option>
              <option value="pengumuman">Pengumuman</option>
              <option value="tips">Tips</option>
            </select>
          </Field>
          <Field label="Status Aktif">
            <select
              className={controlClass}
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            >
              <option value="">Semua</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
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
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-background text-left text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">ID</th>
                <th scope="col" className="px-4 py-3 font-medium">Judul</th>
                <th scope="col" className="px-4 py-3 font-medium">Tipe</th>
                <th scope="col" className="px-4 py-3 font-medium">Aktif</th>
                <th scope="col" className="px-4 py-3 font-medium">Urutan</th>
                <th scope="col" className="px-4 py-3 font-medium">Dibuat</th>
                <th scope="col" className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, ri) => (
                  <tr key={ri} className="border-b border-border">
                    {Array.from({ length: 7 }).map((__, ci) => (
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
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-medium">{row.judul}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{row.isi}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <TipeBadge tipe={row.tipe} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.is_active ? (
                        <span className="inline-flex rounded-control border border-primary/30 bg-success-subtle px-2 py-0.5 text-xs font-medium text-primary">
                          Aktif
                        </span>
                      ) : (
                        <StatusBadge>Nonaktif</StatusBadge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">{row.urutan_tampil}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={deletingId === row.id}
                          onClick={() => setPendingDelete(row)}
                        >
                          {deletingId === row.id ? (
                            <Spinner className="mr-1 size-3" label="Menghapus" />
                          ) : null}
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}><EmptyState title="Konten tidak ditemukan" description="Ubah filter atau buat konten publik baru." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPageChange={setPage} />
      </Card>
      <ConfirmDialog open={Boolean(pendingDelete)} title="Hapus konten?" description={pendingDelete ? `Konten “${pendingDelete.judul}” akan dihapus permanen.` : ""} confirmLabel="Hapus konten" busy={deletingId !== null} onCancel={() => setPendingDelete(null)} onConfirm={() => pendingDelete ? confirmDelete(pendingDelete.id) : undefined} />
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function TipeBadge({ tipe }: { tipe?: string }) {
  const colors: Record<string, string> = {
    pengumuman: "border-primary/30 bg-success-subtle text-primary",
    tips: "border-wait/30 bg-warning-subtle text-wait",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium capitalize",
        colors[tipe || ""] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {tipe || "-"}
    </span>
  );
}
