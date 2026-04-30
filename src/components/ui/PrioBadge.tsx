type Prio = "basse" | "moyenne" | "haute" | "critique";

const PRIO_STYLES: Record<Prio, { dot: string; fg: string; label: string }> = {
  basse:    { dot: "bg-blue-400",   fg: "text-blue-700",   label: "Basse" },
  moyenne:  { dot: "bg-yellow-400", fg: "text-yellow-700", label: "Moyenne" },
  haute:    { dot: "bg-orange-500", fg: "text-orange-700", label: "Haute" },
  critique: { dot: "bg-red-500",    fg: "text-red-700",    label: "Critique" },
};

export function PrioBadge({ priorite }: { priorite: string | null | undefined }) {
  const key = (priorite || "moyenne") as Prio;
  const s = PRIO_STYLES[key] || PRIO_STYLES.moyenne;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.fg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
