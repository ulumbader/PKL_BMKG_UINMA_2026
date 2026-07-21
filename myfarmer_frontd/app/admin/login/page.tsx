"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { Field, controlClass } from "@/components/admin/AdminUI";
import { Alert, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/apiClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isReady, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) router.replace("/admin/dashboard");
  }, [isAuthenticated, isReady, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await login({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-svh overflow-x-hidden bg-background text-foreground lg:grid lg:grid-cols-[minmax(20rem,0.85fr)_minmax(28rem,1.15fr)]">
      <section className="flex border-b border-border bg-success-subtle px-6 py-8 lg:min-h-svh lg:items-center lg:border-b-0 lg:border-r lg:px-12">
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-card border border-primary/20 bg-surface">
              <Image src="/logo_bmkg.png" alt="Logo BMKG" width={54} height={54} className="size-13 object-contain" priority />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold tracking-tight text-primary">MyFarmer</p>
              <p className="text-sm font-medium leading-5 text-muted">Sistem Informasi Rekomendasi Tanam</p>
            </div>
          </div>
          <div className="mt-8 hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">BMKG Jawa Timur</p>
            <h1 className="mt-3 max-w-md text-3xl font-semibold leading-tight">Data iklim yang tertata untuk keputusan tanam yang lebih baik.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">Panel internal Stasiun Klimatologi Jawa Timur untuk mengelola data observasi, proses agregasi, rekomendasi, dan publikasi informasi.</p>
          </div>
        </div>
      </section>

      <section className="flex px-6 py-10 sm:px-10 lg:min-h-svh lg:items-center lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-7">
            <p className="text-sm font-semibold text-primary">Akses terbatas</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Masuk ke Panel Admin</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Gunakan akun admin atau super admin yang telah terdaftar.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <Field label="Email" required>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              aria-invalid={Boolean(error)}
              className={controlClass}
              placeholder="nama@bmkg.go.id"
            />
          </Field>

          <Field label="Password" required>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(error)}
              className={controlClass}
              placeholder="Masukkan password"
            />
          </Field>

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>
          <p className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted">Akses dan aktivitas pada sistem ini dicatat. Hubungi Super Admin jika akun Anda tidak dapat digunakan.</p>
        </div>
      </section>
    </main>
  );
}
