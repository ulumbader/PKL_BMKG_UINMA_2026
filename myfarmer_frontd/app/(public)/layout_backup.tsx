import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-xl font-semibold text-primary">MyFarmer</p>
          <p className="text-sm text-muted">Panduan tanam padi berbasis cuaca.</p>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-4 text-sm text-muted">
          MyFarmer - Informasi pertanian untuk petani.
        </div>
      </footer>
    </div>
  );
}
