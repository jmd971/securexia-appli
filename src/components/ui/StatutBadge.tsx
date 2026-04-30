type Statut = "a_faire" | "en_cours" | "fait" | "en_retard";

const STATUT_STYLES: Record<Statut, { bg: string; fg: string; label: string }> = {
  a_faire:   { bg: "bg-blue-50",    fg: "text-blue-700",    label: "À faire" },
  en_cours:  { bg: "bg-warn-light", fg: "text-warn",        label: "En cours" },
  fait:      { bg: "bg-success-light", fg: "text-success",  label: "Fait" },
  en_retard: { bg: "bg-danger-light",  fg: "text-danger",   label: "En retard" },
};

export function StatutBadge({ statut }: { statut: string | null | undefined }) {
  const key = (statut || "a_faire") as Statut;
  const s = STATUT_STYLES[key] || STATUT_STYLES.a_faire;
  return (
    <span className={`badge ${s.bg} ${s.fg}`}>
      {s.label}
    </span>
  );
}
