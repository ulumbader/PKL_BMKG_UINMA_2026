"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";

import {
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  StatusBadge,
  ToastNotice,
  controlClass,
  textareaClass,
} from "@/components/admin/AdminUI";
import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";

type ContentType = "pengumuman" | "tips" | "sorotan" | "poster" | "pdf";
type Tab = "teks" | "sorotan" | "poster" | "pdf";

type AdminContent = {
  id: number;
  judul: string;
  isi: string | null;
  tipe: ContentType;
  jenis_media: "image" | "video" | "pdf" | null;
  path_file: string | null;
  path_thumbnail: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  url_sumber: string | null;
  alt_text: string | null;
  is_active: boolean;
  urutan_tampil: number;
  updated_at?: string;
};

type Paginated<T> = { data?: T[] };
type FieldErrors = Record<string, string>;

type ContentForm = {
  judul: string;
  isi: string;
  tipe: ContentType;
  url_sumber: string;
  alt_text: string;
  urutan_tampil: string;
  is_active: boolean;
  hapus_thumbnail: boolean;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "teks", label: "Pengumuman & Tips" },
  { id: "sorotan", label: "Sorotan" },
  { id: "poster", label: "Poster" },
  { id: "pdf", label: "PDF" },
];

function initialForm(tab: Tab): ContentForm {
  return {
    judul: "",
    isi: "",
    tipe: tab === "teks" ? "pengumuman" : tab,
    url_sumber: "",
    alt_text: "",
    urutan_tampil: "0",
    is_active: true,
    hapus_thumbnail: false,
  };
}

function extractItems(result: AdminContent[] | Paginated<AdminContent>) {
  return Array.isArray(result) ? result : result.data ?? [];
}

function getErrorMessage(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback;
}

function getFieldErrors(caught: unknown): FieldErrors {
  if (!(caught instanceof ApiError) || !caught.errors || typeof caught.errors !== "object") return {};
  return Object.fromEntries(Object.entries(caught.errors as Record<string, unknown>).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map(String).join(" ") : String(value),
  ]));
}

function savedFileName(path: string | null) {
  return path?.split("/").pop() ?? "Belum ada file";
}

function mediaAccept(type: ContentType) {
  if (type === "sorotan") return "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";
  if (type === "poster") return "image/jpeg,image/png,image/webp";
  return "application/pdf";
}

function FilePreview({
  type,
  kind,
  url,
  alt,
}: {
  type: ContentType;
  kind?: AdminContent["jenis_media"];
  url: string;
  alt: string;
}) {
  if (type === "pdf") {
    return <div className="flex min-h-28 items-center justify-center rounded-control border border-border bg-background px-4 text-center text-sm text-muted">File PDF siap ditampilkan.</div>;
  }
  if (kind === "video") {
    return <video src={url} controls preload="metadata" className="max-h-64 w-full rounded-control bg-black object-contain" aria-label={alt} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className="max-h-64 w-full rounded-control bg-background object-contain" />;
}

export function ContentManager() {
  const [tab, setTab] = useState<Tab>("teks");
  const [rows, setRows] = useState<AdminContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminContent | null>(null);
  const [form, setForm] = useState<ContentForm>(initialForm("teks"));
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminContent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const typeFilters = useMemo<ContentType[]>(
    () => tab === "teks" ? ["pengumuman", "tips"] : [tab],
    [tab],
  );

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const responses = await Promise.all(typeFilters.map((type) =>
          apiGet<AdminContent[] | Paginated<AdminContent>>(`/admin/konten?tipe=${type}&per_page=100`, { signal: controller.signal }),
        ));
        if (controller.signal.aborted) return;
        setRows(responses.flatMap((response) => extractItems(response.data)).sort((a, b) =>
          a.urutan_tampil - b.urutan_tampil || a.id - b.id,
        ));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setRows([]);
          setError(getErrorMessage(caught, "Data konten gagal dimuat."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [reloadKey, typeFilters]);

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
  }, [filePreview, thumbnailPreview]);

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    setShowForm(false);
    setEditing(null);
    setError("");
    setNotice("");
  }

  function resetUploads() {
    if (filePreview) URL.revokeObjectURL(filePreview);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setFile(null);
    setThumbnail(null);
    setFilePreview("");
    setThumbnailPreview("");
  }

  function openCreate() {
    resetUploads();
    setEditing(null);
    setForm(initialForm(tab));
    setFormErrors({});
    setShowForm(true);
  }

  function openEdit(row: AdminContent) {
    resetUploads();
    setEditing(row);
    setForm({
      judul: row.judul,
      isi: row.isi ?? "",
      tipe: row.tipe,
      url_sumber: row.url_sumber ?? "",
      alt_text: row.alt_text ?? "",
      urutan_tampil: String(row.urutan_tampil),
      is_active: row.is_active,
      hapus_thumbnail: false,
    });
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    resetUploads();
    setFormErrors({});
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>, thumbnailFile = false) {
    const selected = event.target.files?.[0] ?? null;
    if (thumbnailFile) {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnail(selected);
      setThumbnailPreview(selected ? URL.createObjectURL(selected) : "");
    } else {
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFile(selected);
      setFilePreview(selected ? URL.createObjectURL(selected) : "");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFormErrors({});

    const body = new FormData();
    body.append("judul", form.judul);
    body.append("tipe", form.tipe);
    body.append("urutan_tampil", String(Number(form.urutan_tampil) || 0));
    body.append("is_active", form.is_active ? "1" : "0");
    if (form.tipe === "pengumuman" || form.tipe === "tips") body.append("isi", form.isi);
    if (["poster", "pdf"].includes(form.tipe)) body.append("url_sumber", form.url_sumber);
    if (["sorotan", "poster"].includes(form.tipe)) body.append("alt_text", form.alt_text);
    if (file) body.append("file_media", file);
    if (thumbnail) body.append("thumbnail", thumbnail);
    if (form.hapus_thumbnail) body.append("hapus_thumbnail", "1");

    try {
      if (editing) body.append("_method", "PUT");
      const response = await apiPost<AdminContent>(editing ? `/admin/konten/${editing.id}` : "/admin/konten", body);
      setNotice(response.message);
      closeForm();
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(getErrorMessage(caught, editing ? "Konten gagal diperbarui." : "Konten gagal dibuat."));
      setFormErrors(getFieldErrors(caught));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: AdminContent) {
    setTogglingId(row.id);
    setError("");
    try {
      const response = await apiPut<AdminContent>(`/admin/konten/${row.id}`, {
        is_active: !row.is_active,
      });
      setNotice(response.message);
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(getErrorMessage(caught, "Status konten gagal diubah."));
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await apiDelete<null>(`/admin/konten/${pendingDelete.id}`);
      setNotice(response.message);
      setPendingDelete(null);
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(getErrorMessage(caught, "Konten gagal dihapus."));
    } finally {
      setDeleting(false);
    }
  }

  const isText = form.tipe === "pengumuman" || form.tipe === "tips";
  const title = tabs.find((item) => item.id === tab)?.label ?? "Konten";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Konten"
        description="Kelola pengumuman, tips, sorotan, poster, dan dokumen PDF untuk landing page."
        action={<Button type="button" onClick={openCreate}>Tambah {title}</Button>}
      />

      <div className="flex gap-2 overflow-x-auto border-b border-border" role="tablist" aria-label="Jenis konten">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => selectTab(item.id)}
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              tab === item.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notice ? <ToastNotice message={notice} onDismiss={() => setNotice("")} /> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-56" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState title={`Belum ada ${title.toLowerCase()}`} description="Gunakan tombol tambah untuk membuat konten pertama." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <Card key={row.id} className="flex min-h-56 flex-col gap-4">
              {row.file_url ? (
                row.tipe === "pdf" ? (
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-control bg-background">
                    {row.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.thumbnail_url} alt="" loading="lazy" className="size-full object-cover" />
                    ) : <span className="text-sm font-semibold text-muted">PDF</span>}
                  </div>
                ) : row.jenis_media === "video" ? (
                  <video src={row.file_url} preload="metadata" muted className="h-36 w-full rounded-control bg-black object-cover" aria-label={row.alt_text ?? row.judul} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.file_url} alt={row.alt_text ?? row.judul} loading="lazy" className="h-36 w-full rounded-control bg-background object-cover" />
                )
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-foreground">{row.judul}</h2>
                  <StatusBadge tone={row.is_active ? "success" : "neutral"}>{row.is_active ? "Aktif" : "Nonaktif"}</StatusBadge>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                  {row.isi || (row.path_file ? savedFileName(row.path_file) : "Konten media")}
                </p>
                <p className="mt-2 text-xs text-muted">Urutan {row.urutan_tampil} · {row.tipe}</p>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
                <Button type="button" size="sm" variant="secondary" disabled={togglingId === row.id} onClick={() => void toggleStatus(row)}>
                  {togglingId === row.id ? "Memproses..." : row.is_active ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={() => setPendingDelete(row)}>Hapus</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={saving ? () => undefined : closeForm} title={editing ? `Edit ${title}` : `Tambah ${title}`} description="File baru hanya diperlukan saat membuat konten atau mengganti file lama." size="lg">
        <form onSubmit={submit} className="space-y-5">
          {tab === "teks" ? (
            <Field label="Jenis konten" required error={formErrors.tipe}>
              <select className={controlClass} value={form.tipe} onChange={(event) => setForm((value) => ({ ...value, tipe: event.target.value as ContentType }))}>
                <option value="pengumuman">Pengumuman</option>
                <option value="tips">Tips</option>
              </select>
            </Field>
          ) : null}

          <Field label="Judul" required error={formErrors.judul}>
            <input className={controlClass} value={form.judul} onChange={(event) => setForm((value) => ({ ...value, judul: event.target.value }))} />
          </Field>

          {isText ? (
            <Field label="Isi" required error={formErrors.isi}>
              <textarea className={textareaClass} value={form.isi} onChange={(event) => setForm((value) => ({ ...value, isi: event.target.value }))} />
            </Field>
          ) : (
            <>
              <Field label={form.tipe === "pdf" ? "File PDF" : "File media"} required={!editing} error={formErrors.file_media} hint={editing ? `File tersimpan: ${savedFileName(editing.path_file)}` : undefined}>
                <input className={`${controlClass} h-auto py-2`} type="file" accept={mediaAccept(form.tipe)} onChange={(event) => chooseFile(event)} />
              </Field>
              {filePreview ? <FilePreview type={form.tipe} kind={file?.type.startsWith("video/") ? "video" : form.tipe === "pdf" ? "pdf" : "image"} url={filePreview} alt={form.alt_text || form.judul} /> : editing?.file_url ? <FilePreview type={form.tipe} kind={editing.jenis_media} url={editing.file_url} alt={editing.alt_text || editing.judul} /> : null}

              {form.tipe === "sorotan" || form.tipe === "pdf" ? (
                <>
                  <Field label={form.tipe === "pdf" ? "Cover/thumbnail (opsional)" : "Thumbnail video (opsional)"} error={formErrors.thumbnail} hint={editing?.path_thumbnail ? `Thumbnail tersimpan: ${savedFileName(editing.path_thumbnail)}` : undefined}>
                    <input className={`${controlClass} h-auto py-2`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event, true)} />
                  </Field>
                  {thumbnailPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbnailPreview} alt="Preview thumbnail baru" className="h-32 w-full rounded-control bg-background object-contain" />
                  ) : editing?.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editing.thumbnail_url} alt="Thumbnail tersimpan" className="h-32 w-full rounded-control bg-background object-contain" />
                  ) : null}
                  {editing?.path_thumbnail ? (
                    <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.hapus_thumbnail} onChange={(event) => setForm((value) => ({ ...value, hapus_thumbnail: event.target.checked }))} /> Hapus thumbnail lama</label>
                  ) : null}
                </>
              ) : null}

              {form.tipe === "sorotan" || form.tipe === "poster" ? (
                <Field label="Teks alternatif/alt text" error={formErrors.alt_text} hint="Jelaskan isi visual secara singkat untuk pembaca layar.">
                  <input className={controlClass} value={form.alt_text} onChange={(event) => setForm((value) => ({ ...value, alt_text: event.target.value }))} />
                </Field>
              ) : null}

              {form.tipe === "poster" || form.tipe === "pdf" ? (
                <Field label="URL sumber (opsional)" error={formErrors.url_sumber} hint="Jika diisi, gunakan alamat http:// atau https://.">
                  <input className={controlClass} type="url" value={form.url_sumber} onChange={(event) => setForm((value) => ({ ...value, url_sumber: event.target.value }))} />
                </Field>
              ) : null}
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Urutan tampil" error={formErrors.urutan_tampil}>
              <input className={controlClass} type="number" min="0" value={form.urutan_tampil} onChange={(event) => setForm((value) => ({ ...value, urutan_tampil: event.target.value }))} />
            </Field>
            <Field label="Status" error={formErrors.is_active}>
              <label className="flex h-10 items-center gap-3 rounded-control border border-border px-3 text-sm font-normal">
                <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((value) => ({ ...value, is_active: event.target.checked }))} /> Aktif di landing page
              </label>
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" disabled={saving} onClick={closeForm}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? <><Spinner className="size-4 border-white/40 border-t-white" /> Menyimpan...</> : "Simpan"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Hapus konten?"
        description={`Konten “${pendingDelete?.judul ?? ""}” dan file terkait akan dihapus permanen.`}
        confirmLabel="Hapus"
        busy={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
