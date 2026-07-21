"use client";

import { type FormEvent, useEffect, useState } from "react";

import { ConfirmDialog, EmptyState, Field, PageHeader, StatusBadge, ToastNotice, controlClass } from "@/components/admin/AdminUI";
import { Alert, Button, Card, Skeleton, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type UserRow = {
  id: number;
  nama_lengkap: string;
  email: string;
  nama_role: string;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
};

type FieldErrors = Record<string, string>;

type UserForm = {
  nama_lengkap: string;
  email: string;
  password: string;
  role_id: string;
  is_active: boolean;
};

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const emptyForm: UserForm = {
  nama_lengkap: "",
  email: "",
  password: "",
  role_id: "1",
  is_active: true,
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

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
  const { nama_role, isReady, user } = useAuth();

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
        <h1 className="text-2xl font-semibold">Kelola User</h1>
        <Alert variant="error">
          Anda tidak memiliki izin untuk mengakses halaman ini. Hanya <strong>super admin</strong> yang dapat mengelola user.
        </Alert>
      </div>
    );
  }

  return <UsersContent currentUserId={user?.id ?? null} />;
}

/* ────────────────────────────────────────────
   Users Content (only rendered for super_admin)
   ──────────────────────────────────────────── */

function UsersContent({ currentUserId }: { currentUserId: number | null }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  /* ── Alerts ── */
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  /* ── Form state ── */
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  /* ── Delete state ── */
  const [actionId, setActionId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{ row: UserRow; type: "deactivate" | "delete" } | null>(null);

  /* ──────────────── Data Fetching ──────────────── */

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await apiGet<UserRow[]>("/admin/users");
        if (!active) return;
        setRows(response.data);
      } catch (caught) {
        if (!active) return;
        setRows([]);
        setError(errorMessage(caught, "Daftar user gagal dimuat."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [reloadKey]);

  /* ──────────────── Create / Edit ──────────────── */

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
    setNotice("");
    setError("");
  }

  function openEdit(row: UserRow) {
    setEditingId(row.id);
    setForm({
      nama_lengkap: row.nama_lengkap,
      email: row.email,
      password: "",
      role_id: row.nama_role === "super_admin" ? "2" : "1",
      is_active: row.is_active,
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

    try {
      if (editingId) {
        // Update — only send changed fields; password only if provided
        const body: Record<string, unknown> = {
          nama_lengkap: form.nama_lengkap,
          is_active: form.is_active,
        };
        if (form.password) body.password = form.password;

        const response = await apiPut<UserRow>(`/admin/users/${editingId}`, body);
        setNotice(response.message);
      } else {
        // Create
        const body = {
          nama_lengkap: form.nama_lengkap,
          email: form.email,
          password: form.password,
          role_id: Number(form.role_id),
        };
        const response = await apiPost<UserRow>("/admin/users", body);
        setNotice(response.message);
      }
      closeForm();
      setReloadKey((v) => v + 1);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFormErrors(fieldErrors(caught.errors));
        setError(caught.message);
      } else {
        setError(editingId ? "Gagal memperbarui user." : "Gagal membuat user.");
      }
    } finally {
      setSaving(false);
    }
  }

  /* ──────────────── Nonaktifkan / Hapus Permanen ──────────────── */

  async function deactivateUser(id: number) {
    setNotice("");
    setError("");
    setActionId(id);
    try {
      const response = await apiDelete<null>(`/admin/users/${id}`);
      setNotice(response.message);
      setPendingAction(null);
      setReloadKey((v) => v + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Gagal menonaktifkan user."));
    } finally {
      setActionId(null);
    }
  }

  async function deletePermanent(id: number) {
    setNotice("");
    setError("");
    setActionId(id);
    try {
      const response = await apiDelete<null>(`/admin/users/${id}?force=true`);
      setNotice(response.message);
      setPendingAction(null);
      setReloadKey((v) => v + 1);
    } catch (caught) {
      setError(errorMessage(caught, "Gagal menghapus user."));
    } finally {
      setActionId(null);
    }
  }

  /* ──────────────── Render ──────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Kelola User" description="Buat, edit, nonaktifkan, atau hapus akun admin. Akses khusus Super Admin." action={<Button onClick={openCreate}>Tambah User</Button>} />

      {/* Alerts */}
      <ToastNotice message={notice} onDismiss={() => setNotice("")} />
      {error && !showForm ? <Alert variant="error">{error}</Alert> : null}

      {/* ──────── Create / Edit Form ──────── */}
      {showForm ? (
        <Card>
          <form onSubmit={submitForm} className="space-y-4">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit User" : "Tambah User Baru"}
            </h2>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Lengkap" error={formErrors.nama_lengkap}>
                <input
                  className={controlClass}
                  required
                  value={form.nama_lengkap}
                  onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </Field>

              <Field label="Email" error={formErrors.email}>
                <input
                  className={controlClass}
                  required={!editingId}
                  type="email"
                  disabled={!!editingId}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@myfarmer.test"
                />
              </Field>

              <Field
                label={editingId ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
                error={formErrors.password}
              >
                <input
                  className={controlClass}
                  type="password"
                  required={!editingId}
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? "Biarkan kosong" : "Minimal 6 karakter"}
                />
              </Field>

              {!editingId ? (
                <Field label="Role" error={formErrors.role_id}>
                  <select
                    className={controlClass}
                    required
                    value={form.role_id}
                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  >
                    <option value="1">Admin</option>
                    <option value="2">Super Admin</option>
                  </select>
                </Field>
              ) : (
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
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner className="mr-2 size-4" label="Menyimpan" /> : null}
                {editingId ? "Simpan Perubahan" : "Buat User"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>
                Batal
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* ──────── Table ──────── */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-background text-left text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">ID</th>
                <th scope="col" className="px-4 py-3 font-medium">Nama</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Aktif</th>
                <th scope="col" className="px-4 py-3 font-medium">Login Terakhir</th>
                <th scope="col" className="px-4 py-3 font-medium">Dibuat</th>
                <th scope="col" className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, ri) => (
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
                  const isSelf = row.id === currentUserId;
                  return (
                    <tr key={row.id} className="border-b border-border transition-colors hover:bg-background/70 last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">{row.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{row.nama_lengkap}</td>
                      <td className="whitespace-nowrap px-4 py-3">{row.email}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <RoleBadge role={row.nama_role} />
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
                      <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.last_login)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          {!isSelf ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionId === row.id}
                                onClick={() => setPendingAction({ row, type: "deactivate" })}
                              >
                                {actionId === row.id ? (
                                  <Spinner className="mr-1 size-3" />
                                ) : null}
                                Nonaktifkan
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={actionId === row.id}
                                onClick={() => setPendingAction({ row, type: "delete" })}
                              >
                                Hapus Permanen
                              </Button>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-2 text-xs text-muted">
                              (Anda)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}><EmptyState title="Belum ada user" description="Tambahkan akun admin untuk mulai mengelola akses panel." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <ConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.type === "delete" ? "Hapus user permanen?" : "Nonaktifkan user?"} description={pendingAction ? pendingAction.type === "delete" ? `Akun “${pendingAction.row.nama_lengkap}” akan dihapus permanen dan tidak dapat dipulihkan.` : `Akun “${pendingAction.row.nama_lengkap}” tidak akan dapat masuk sampai diaktifkan kembali.` : ""} confirmLabel={pendingAction?.type === "delete" ? "Hapus permanen" : "Nonaktifkan"} busy={actionId !== null} onCancel={() => setPendingAction(null)} onConfirm={() => pendingAction ? pendingAction.type === "delete" ? deletePermanent(pendingAction.row.id) : deactivateUser(pendingAction.row.id) : undefined} />
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function RoleBadge({ role }: { role?: string }) {
  const colors: Record<string, string> = {
    super_admin: "border-primary/30 bg-success-subtle text-primary",
    admin: "border-wait/30 bg-warning-subtle text-wait",
  };

  return (
    <span
      className={[
        "inline-flex rounded-control border px-2 py-1 text-xs font-medium",
        colors[role || ""] ?? "border-border bg-background text-muted",
      ].join(" ")}
    >
      {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role || "-"}
    </span>
  );
}
