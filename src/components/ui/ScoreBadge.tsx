import { SCORE_COLORS, SCORE_LABELS } from "@/types/erp";

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, { box: string; value: string; sub: string }> = {
  sm: { box: "h-9 w-9 text-sm", value: "text-base font-semibold", sub: "text-[9px]" },
  md: { box: "h-14 w-14", value: "text-xl font-bold", sub: "text-[10px]" },
  lg: { box: "h-24 w-24", value: "text-4xl font-bold", sub: "text-[11px]" },
};

export function ScoreBadge({ score, size = "md", showLabel = false }: { score: number; size?: Size; showLabel?: boolean }) {
  const safe = Math.max(0, Math.min(5, Math.round(score)));
  const color = SCORE_COLORS[safe] || "#94A3B8";
  const label = SCORE_LABELS[safe] || "Non évalué";
  const s = SIZE_MAP[size];

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={`${s.box} flex flex-col items-center justify-center rounded-full text-white shadow-sm`}
        style={{ backgroundColor: color }}
        aria-label={`Score ${score}/5 ${label}`}
      >
        <span className={s.value}>{score > 0 ? score.toFixed(score % 1 ? 1 : 0) : "—"}</span>
        {size !== "sm" && <span className={`${s.sub} uppercase tracking-wider opacity-90`}>/ 5</span>}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold" style={{ color }}>{label}</span>
          <span className="text-xs text-muted">Score global</span>
        </div>
      )}
    </div>
  );
}
