"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { SECTIONS, SectionKey } from "@/types/erp";

export function ErpRadarChart({
  scores,
  applicables,
}: {
  scores: Partial<Record<SectionKey, number>>;
  applicables: SectionKey[];
}) {
  const data = applicables.map(key => ({
    section: SECTIONS[key].label,
    score: scores[key] ?? 0,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="section" tick={{ fontSize: 11, fill: "#1A2332" }} />
          <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10, fill: "#94A3B8" }} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#0F2B46"
            fill="#0F2B46"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
