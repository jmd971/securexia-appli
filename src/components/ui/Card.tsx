import { ReactNode } from "react";

export function Card({
  children,
  title,
  subtitle,
  action,
  className = "",
  bodyClassName = "p-5",
}: {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-navy">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
  accent = "navy",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: string;
  accent?: "navy" | "success" | "danger" | "warn" | "accent";
  icon?: ReactNode;
}) {
  const accentMap: Record<string, string> = {
    navy: "bg-navy/10 text-navy",
    success: "bg-success-light text-success",
    danger: "bg-danger-light text-danger",
    warn: "bg-warn-light text-warn",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className="card flex items-start justify-between gap-3 p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-2 text-3xl font-bold text-navy">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        {trend && <p className="mt-1 text-xs font-medium text-success">{trend}</p>}
      </div>
      {icon && <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentMap[accent]}`}>{icon}</div>}
    </div>
  );
}
