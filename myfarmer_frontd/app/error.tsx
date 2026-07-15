"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in development
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-danger/30 bg-danger-subtle">
          <svg
            className="size-6 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold">Terjadi Kesalahan</h1>
        <p className="mt-3 text-base leading-7 text-muted">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-muted">
            Kode error: <code className="rounded bg-surface px-1.5 py-0.5">{error.digest}</code>
          </p>
        ) : null}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-control border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-control border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Ke Halaman Utama
          </Link>
        </div>
      </div>
    </main>
  );
}
