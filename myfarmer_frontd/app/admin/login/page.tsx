"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";
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
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-10 text-foreground">
      <Card className="w-full max-w-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary">MyFarmer Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Login Admin</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Masuk untuk mengelola data rekomendasi tanam.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <label className="flex flex-col gap-2 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
