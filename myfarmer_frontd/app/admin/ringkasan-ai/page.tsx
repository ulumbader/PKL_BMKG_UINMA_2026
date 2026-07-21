"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { Field, FilterPanel, PageHeader, Pagination, ToastNotice, controlClass, textareaClass } from "@/components/admin/AdminUI";
import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { ApiError, apiDelete, apiGet, apiGetAllPages, apiPost, apiPut } from "@/lib/apiClient";

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

type RingkasanRow = {
  id: number;
  hasil_rekomendasi_id: number;
  ringkasan_text: string;
  status: "draft" | "published" | string;
  is_edited_manual: boolean;
  generated_at?: string;
  published_at?: string | null;
  direview_oleh?: number | null;
};

type RecommendationOption = {
  id: number;
  dasarian_id: number;
  rule_id: number;
  status_rekomendasi: string;
  catatan_teknis?: string;
  generated_at?: string;
  rule?: { nama_rule?: string; nama?: string };
  dasarian?: {
    id: number;
    stasiun_id: number;
    tahun: number;
    bulan: number;
    dasarian_ke: number;
    stasiun?: { nama_stasiun?: string };
  };
};

type FieldErrors = Record<string, string>;

type Filters = {
  status: string;
  per_page: string;
};

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const emptyFilters: Filters = { status: "", per_page: "15" };

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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

function rekomLabel(item: RecommendationOption) {
  const dasarian = item.dasarian;
  if (dasarian) {
    const month = monthNames[dasarian.bulan - 1] ?? `Bulan ${dasarian.bulan}`;
    const station = dasarian.stasiun?.nama_stasiun ?? `Stasiun ${dasarian.stasiun_id}`;
    return `Rekom #${item.id} — D${dasarian.dasarian_ke} ${month} ${dasarian.tahun} — ${station}`;
  }
  return `Rekomendasi #${item.id}`;
}

function statusText(status?: string) {
  return (status || "-").replace(/_/g, " ");
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
  const [rows, setRows] = useState<RingkasanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  /* ── Options for generate form ── */
  const [rekomOptions, setRekomOptions] = useState<RecommendationOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  /* ── Generate form state ── */
  const [generateRekomId, setGenerateRekomId] = useState("");
  const [generateErrors, setGenerateErrors] = useState<FieldErrors>({});
  const [generating, setGenerating] = useState(false);

  /* ── Alerts ── */
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  /* ── Edit/Publish state per row ── */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editAction, setEditAction] = useState<"edit" | "publish" | "edit_publish">("edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  /* ──────────────── Data Fetching ──────────────── */

  // Load rekomendasi options for the generate dropdown
  useEffect(() => {
    let active = true;
    async function loadOptions() {
      setOptionsLoading(true);
      try {
        const options = await apiGetAllPages<RecommendationOption>(
          "/admin/rekomendasi?per_page=200",
        );
        if (!active) return;
        setRekomOptions(options);
      } catch {
        if (!active) return;
        setRekomOptions([]);
      } finally {
        if (active) setOptionsLoading(false);
      }
    }
    loadOptions();
    return () => { active = false; };
  }, []);

  // Load ringkasan table
  useEffect(() => {
    let active = true;
    async function loadRows() {
      setLoading(true);
      setError("");
      try {
        const response = await apiGet<ListResult<RingkasanRow>>(
          `/admin/ringkasan?${buildQuery(appliedFilters, page)}`,
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
        setError(errorMessage(caught, "Data ringkasan AI gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRows();
    return () => { active = false; };
  }, [appliedFilters, page, reloadKey]);

  /* ──────────────── Filter Submit ──────────────── */

  const submitFilter = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setNotice("");
    setAppliedFilters(filters);
  }, [filters]);

  /* ──────────────── Generate ──────────────── */

  async function submitGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setGenerateErrors({});

    if (!generateRekomId) {
      setGenerateErrors({ hasil_rekomendasi_id: "Hasil rekomendasi wajib dipilih." });
      return;
    }

    setGenerating(true);
    try {
      const response = await apiPost<RingkasanRow>("/admin/ringkasan/generate", {
        hasil_rekomendasi_id: Number(generateRekomId),
      });
      setNotice(response.message);
      setGenerateRekomId("");
      setReloadKey((v) => v + 1);
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.statusCode === 409) {
          // Duplikasi — show specific message from backend
          setError(caught.message);
        } else {
          setGenerateErrors(fieldErrors(caught.errors));
          setError(caught.message);
        }
      } else {
        setError("Generate ringkasan AI gagal.");
      }
    } finally {
      setGenerating(false);
    }
  }

  /* ──────────────── Edit / Publish ──────────────── */

  function startEdit(row: RingkasanRow) {
    setEditingId(row.id);
    setEditText(row.ringkasan_text);
    setEditAction("edit");
    setNotice("");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function submitUpdate(event: FormEvent<HTMLFormElement>, rowId: number) {
    event.preventDefault();
    setNotice("");
    setError("");
    setSaving(true);

    const body: Record<string, unknown> = {};

    if (editAction === "edit" || editAction === "edit_publish") {
      body.ringkasan_text = editText;
    }
    if (editAction === "publish" || editAction === "edit_publish") {
      body.status = "published";
    }

    try {
      const response = await apiPut<RingkasanRow>(`/admin/ringkasan/${rowId}`, body);
      setNotice(response.message);
      setEditingId(null);
      setEditText("");
      setReloadKey((v) => v + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Gagal memperbarui ringkasan."));
    } finally {
      setSaving(false);
    }
  }

  function quickPublish(rowId: number) {
    setNotice("");
    setError("");
    setSaving(true);
    apiPut<RingkasanRow>(`/admin/ringkasan/${rowId}`, { status: "published" })
      .then((response) => {
        setNotice(response.message);
        setReloadKey((v) => v + 1);
      })
      .catch((caught) => {
        setError(errorMessage(caught, "Gagal mem-publish ringkasan."));
      })
      .finally(() => {
        setSaving(false);
      });
  }

  async function deleteRow(rowId: number) {
    if (!confirm("Yakin ingin menghapus ringkasan AI ini? Aksi ini tidak bisa dibatalkan.")) return;
    setNotice("");
    setError("");
    setDeleting(rowId);
    try {
      const response = await apiDelete<null>(`/admin/ringkasan/${rowId}`);
      setNotice(response.message);
      setReloadKey((v) => v + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Gagal menghapus ringkasan."));
    } finally {
      setDeleting(null);
    }
  }

  /* ──────────────── Render ──────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Ringkasan AI" description="Generate, review, edit, dan publish ringkasan dari backend Groq berdasarkan hasil rekomendasi." />

      {/* Alerts */}
      <ToastNotice message={notice} onDismiss={() => setNotice("")} />
      {error ? <Alert variant="error">{error}</Alert> : null}

      {/* ──────── Generate Form ──────── */}
      <Card>
        <form onSubmit={submitGenerate} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Generate Ringkasan</h2>
            <p className="mt-1 text-sm text-muted">
              Pilih hasil rekomendasi untuk di-generate ringkasan AI-nya lewat backend.
              Hasil akan tersimpan sebagai draft yang bisa di-review sebelum di-publish.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <Field label="Hasil Rekomendasi" error={generateErrors.hasil_rekomendasi_id}>
              <select
                required
                className={controlClass}
                disabled={optionsLoading}
                value={generateRekomId}
                onChange={(e) => setGenerateRekomId(e.target.value)}
              >
                <option value="">
                  {optionsLoading ? "Memuat data rekomendasi..." : "Pilih hasil rekomendasi"}
                </option>
                {rekomOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {rekomLabel(item)}
                  </option>
                ))}
              </select>
            </Field>
            <Button
              type="submit"
              disabled={generating || optionsLoading}
              className="md:mt-6"
            >
              {generating ? <Spinner className="mr-2 size-4" label="Generating" /> : null}
              Generate
            </Button>
          </div>
        </form>
      </Card>

      {/* ──────── Filters ──────── */}
      <FilterPanel activeCount={appliedFilters.status ? 1 : 0}>
        <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-4">
          <Field label="Status">
            <select
              className={controlClass}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Semua</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
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
          <div className="flex items-end gap-2 md:col-span-2">
            <Button type="submit" className="flex-1 md:flex-none">Filter</Button>
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
                <th scope="col" className="px-4 py-3 font-medium">Rekom ID</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Ringkasan</th>
                <th scope="col" className="px-4 py-3 font-medium">Diedit Manual</th>
                <th scope="col" className="px-4 py-3 font-medium">Generated</th>
                <th scope="col" className="px-4 py-3 font-medium">Published</th>
                <th scope="col" className="px-4 py-3 font-medium">Aksi</th>
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
                    {editingId === row.id ? (
                      /* ── Inline Edit Mode ── */
                      <td colSpan={8} className="px-4 py-4">
                        <form
                          onSubmit={(e) => submitUpdate(e, row.id)}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3 text-sm text-muted">
                            <span className="font-medium text-foreground">
                              Ringkasan #{row.id}
                            </span>
                            <StatusBadge status={row.status} />
                            <span>Rekom ID: {row.hasil_rekomendasi_id}</span>
                          </div>

                          <Field label="Teks Ringkasan">
                            <textarea
                              className={textareaClass}
                              rows={6}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                            />
                          </Field>

                          <Field label="Aksi yang dilakukan">
                            <select
                              className={controlClass}
                              value={editAction}
                              onChange={(e) =>
                                setEditAction(
                                  e.target.value as "edit" | "publish" | "edit_publish",
                                )
                              }
                            >
                              <option value="edit">Simpan edit teks saja (tetap draft)</option>
                              <option value="publish">Publish saja (tanpa ubah teks)</option>
                              <option value="edit_publish">
                                Edit teks + Publish sekaligus
                              </option>
                            </select>
                          </Field>

                          <div className="flex gap-2">
                            <Button type="submit" disabled={saving}>
                              {saving ? (
                                <Spinner className="mr-2 size-4" label="Menyimpan" />
                              ) : null}
                              {editAction === "edit"
                                ? "Simpan"
                                : editAction === "publish"
                                  ? "Publish"
                                  : "Simpan & Publish"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Batal
                            </Button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      /* ── Normal Row ── */
                      <>
                        <td className="whitespace-nowrap px-4 py-3">{row.id}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {row.hasil_rekomendasi_id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="max-w-md px-4 py-3">
                          <p className="line-clamp-3 whitespace-pre-line text-sm">
                            {row.ringkasan_text || "-"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {row.is_edited_manual ? (
                            <span className="inline-flex rounded-control border border-wait/30 bg-warning-subtle px-2 py-0.5 text-xs font-medium text-wait">
                              Ya
                            </span>
                          ) : (
                            <span className="text-muted">Tidak</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDateTime(row.generated_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDateTime(row.published_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => startEdit(row)}
                              disabled={saving || deleting === row.id}
                            >
                              Edit
                            </Button>
                            {row.status === "draft" ? (
                              <Button
                                size="sm"
                                onClick={() => quickPublish(row.id)}
                                disabled={saving || deleting === row.id}
                              >
                                {saving ? (
                                  <Spinner className="mr-1 size-3" label="Publishing" />
                                ) : null}
                                Publish
                              </Button>
                            ) : (
                              <span className="inline-flex items-center gap-1 self-center text-xs text-primary">
                                <svg
                                  className="size-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Published
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteRow(row.id)}
                              disabled={saving || deleting === row.id}
                            >
                              {deleting === row.id ? (
                                <Spinner className="mr-1 size-3" label="Menghapus" />
                              ) : null}
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Belum ada ringkasan AI sesuai filter.
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
    draft: "border-wait/30 bg-warning-subtle text-wait",
    published: "border-primary/30 bg-success-subtle text-primary",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium capitalize",
        colors[status || ""] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {statusText(status)}
    </span>
  );
}
