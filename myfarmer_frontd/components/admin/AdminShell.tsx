"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

const menus = [
  ["Dashboard", "/admin/dashboard"],
  ["Data Iklim", "/admin/data-iklim"],
  ["Agregasi", "/admin/agregasi"],
  ["Rule Rekomendasi", "/admin/rules"],
  ["Rekomendasi", "/admin/rekomendasi"],
  ["Ringkasan AI", "/admin/ringkasan-ai"],
  ["Konten", "/admin/konten"],
  ["Log Import", "/admin/log-import"],
] as const;

const superAdminMenus = [
  ["Kelola User", "/admin/users"],
  ["Audit Log", "/admin/audit-log"],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isAuthenticated, logout, nama_role, user } = useAuth();
  const isLoginRoute = pathname === "/admin/login";

  /* ── Mobile sidebar state ── */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Close sidebar on route change */
  useEffect(() => {
    const closeSidebar = setTimeout(() => setSidebarOpen(false), 0);
    return () => clearTimeout(closeSidebar);
  }, [pathname]);

  useEffect(() => {
    if (isReady && !isAuthenticated && !isLoginRoute) router.replace("/admin/login");
  }, [isAuthenticated, isLoginRoute, isReady, router]);

  if (isLoginRoute) return <>{children}</>;

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <Spinner label="Memeriksa sesi admin" />
      </main>
    );
  }

  const visibleMenus = nama_role === "super_admin" ? [...menus, ...superAdminMenus] : menus;

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      {/* ── Mobile overlay ── */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* ── Sidebar ── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-border bg-surface transition-transform duration-200 md:static md:translate-x-0 md:transition-none",
          "flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-primary">MyFarmer</p>
              <p className="text-xs text-muted">Panel admin</p>
            </div>
            {/* Close button on mobile */}
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:bg-background hover:text-foreground md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 rounded-control border border-border bg-background px-3 py-2">
            <p className="truncate text-sm font-medium">{user?.nama_lengkap}</p>
            <p className="text-xs text-muted">{nama_role}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {visibleMenus.map(([label, href]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "rounded-control px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-success-subtle text-primary" : "text-muted hover:bg-background hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => logout().then(() => router.replace("/admin/login"))}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 md:px-8">
        {/* Mobile header with hamburger */}
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-4 md:hidden">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-control border border-border bg-surface text-foreground hover:bg-background"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-primary">MyFarmer Admin</p>
            <p className="truncate text-xs text-muted">{user?.nama_lengkap} · {nama_role}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
