"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

import { Alert, Button, Card } from "@/components/ui";

export const controlClass =
  "h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:bg-background disabled:text-muted disabled:opacity-70";

export const textareaClass = `${controlClass} h-auto min-h-28 py-2.5 leading-6`;

type AdminIconName =
  | "dashboard"
  | "climate"
  | "process"
  | "rules"
  | "recommendation"
  | "ai"
  | "content"
  | "import"
  | "users"
  | "audit"
  | "menu"
  | "close"
  | "logout"
  | "database"
  | "check"
  | "warning"
  | "arrow";

const iconPaths: Record<AdminIconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  climate: <><path d="M12 3v18M8 6h8M7 10h10M6 14h12" /><path d="M8 18c1.4-1.4 2.7-2.1 4-2.1s2.6.7 4 2.1" /></>,
  process: <><path d="M4 7h12l-3-3M20 17H8l3 3" /><path d="M17 4l3 3-3 3M7 14l-3 3 3 3" /></>,
  rules: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  recommendation: <><path d="M12 21s7-3.8 7-10V5l-7-2-7 2v6c0 6.2 7 10 7 10Z" /><path d="m9 12 2 2 4-5" /></>,
  ai: <><path d="M8 3h8v3a5 5 0 0 1 3 4v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a5 5 0 0 1 3-4V3Z" /><path d="M9 12h.01M15 12h.01M9 16h6M12 3V1" /></>,
  content: <><path d="M5 3h14v18H5z" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
  import: <><path d="M12 3v12m0 0-4-4m4 4 4-4" /><path d="M5 15v5h14v-5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" /></>,
  audit: <><path d="M6 3h12v18H6z" /><path d="M9 7h6M9 11h6M9 15h3" /><circle cx="16" cy="16" r="3" /><path d="m18 18 2 2" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  warning: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
  arrow: <path d="m9 18 6-6-6-6" />,
};

export function AdminIcon({ name, className = "size-5" }: { name: AdminIconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={["block space-y-1.5 text-sm font-medium text-foreground", className].filter(Boolean).join(" ")}>
      <span>{label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}</span>
      {children}
      {hint && !error ? <span className="block text-xs font-normal leading-5 text-muted">{hint}</span> : null}
      {error ? <span className="block text-xs font-normal leading-5 text-danger">{error}</span> : null}
    </label>
  );
}

export function FilterPanel({
  activeCount = 0,
  children,
}: {
  activeCount?: number;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Filter data</h2>
          <p className="mt-0.5 text-xs text-muted">Persempit data yang ditampilkan pada tabel.</p>
        </div>
        {activeCount > 0 ? <StatusBadge tone="info">{activeCount} aktif</StatusBadge> : null}
      </div>
      {children}
    </Card>
  );
}

const badgeTones = {
  neutral: "border-border bg-background text-muted",
  success: "border-primary/25 bg-success-subtle text-primary",
  warning: "border-wait/25 bg-warning-subtle text-wait",
  danger: "border-danger/25 bg-danger-subtle text-danger",
  info: "border-primary/20 bg-primary/8 text-primary",
};

export function StatusBadge({
  tone = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={["inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none", badgeTones[tone], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function EmptyState({
  title = "Belum ada data",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-background text-muted">
        <AdminIcon name="database" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm leading-6 text-muted">{description}</p> : null}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  loading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{typeof total === "number" ? `${total} data` : "Navigasi halaman"}</p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button type="button" size="sm" variant="secondary" disabled={page <= 1 || loading} onClick={() => onPageChange(Math.max(1, page - 1))}>Sebelumnya</Button>
        <span className="min-w-24 text-center text-sm text-muted">{page} dari {Math.max(1, totalPages)}</span>
        <Button type="button" size="sm" variant="secondary" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>Berikutnya</Button>
      </div>
    </div>
  );
}

const focusableSelector = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      (focusable?.[0] ?? dialogRef.current)?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = oldOverflow;
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={["max-h-[calc(100svh-2rem)] w-full overflow-y-auto rounded-card border border-border bg-surface text-foreground", sizes[size]].join(" ")}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label={`Tutup ${title}`} className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            <AdminIcon name="close" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  busy = false,
  destructive = true,
  showNotice = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  showNotice?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Modal open={open} onClose={busy ? () => undefined : onCancel} title={title} description={description} size="sm">
      {showNotice ? <Alert variant={destructive ? "warning" : "info"} className="mb-5">
        Aksi ini perlu konfirmasi sebelum dilanjutkan.
      </Alert> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Batal</Button>
        <Button type="button" variant={destructive ? "danger" : "primary"} disabled={busy} onClick={onConfirm}>{busy ? "Memproses..." : confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function ToastNotice({
  message,
  variant = "success",
  onDismiss,
}: {
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  onDismiss?: () => void;
}) {
  if (!message) return null;
  return (
    <div className="fixed right-4 top-4 z-[90] w-[min(24rem,calc(100vw-2rem))]" role="status">
      <Alert variant={variant} className="flex items-start justify-between gap-3 bg-surface">
        <span>{message}</span>
        {onDismiss ? <button type="button" aria-label="Tutup notifikasi" onClick={onDismiss} className="shrink-0 rounded-control p-1 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><AdminIcon name="close" className="size-4" /></button> : null}
      </Alert>
    </div>
  );
}
