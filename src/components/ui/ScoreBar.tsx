import { SCORE_COLORS, SCORE_LABELS } from "@/types/erp";

export function ScoreBar({ label, score, icon }: { label: string; score: number; icon?: string }) {
  const safe = Math.max(0, Math.min(5, Math.round(score)));
  const color = SCORE_COLORS[safe] || "#94A3B8";
  const labelText = SCORE_LABELS[safe] || "Non évalué";
  const pct = score > 0 ? (score / 5) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          {icon && <span aria-hidden>{icon}</span>}
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold" style={{ color }}>{score > 0 ? score.toFixed(score % 1 ? 1 : 0) : "—"}/5</span>
          <span className="text-muted">{labelText}</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
