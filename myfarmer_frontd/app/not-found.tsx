import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-base leading-7 text-muted">
          Maaf, halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-control border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Ke Halaman Utama
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-control border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Panel Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
