import { ReactNode } from "react";

export function Topbar({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          {back && <div className="mb-1">{back}</div>}
          <h1 className="truncate text-xl font-bold text-navy">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}
