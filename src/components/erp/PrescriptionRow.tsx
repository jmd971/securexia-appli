"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatutBadge } from "@/components/ui/StatutBadge";
import { PrioBadge } from "@/components/ui/PrioBadge";

const STATUT_OPTIONS = [
  { value: "a_faire", label: "À faire" },
  { value: "en_cours", label: "En cours" },
  { value: "fait", label: "Fait" },
  { value: "en_retard", label: "En retard" },
] as const;

interface Prescription {
  id: string;
  description: string;
  delai: string | null;
  echeance: Date | null;
  responsable: string | null;
  priorite: string;
  statut: string;
}

export function PrescriptionRow({ prescription }: { prescription: Prescription }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function updateStatut(statut: string) {
    startTransition(async () => {
      await fetch(`/api/prescriptions/${prescription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      router.refresh();
    });
  }

  return (
    <li className="px-5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-800">{prescription.description}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {prescription.delai && <span>Délai : {prescription.delai}</span>}
            {prescription.responsable && <span>Resp. : {prescription.responsable}</span>}
            <PrioBadge priorite={prescription.priorite} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatutBadge statut={prescription.statut} />
          <select
            value={prescription.statut}
            onChange={e => updateStatut(e.target.value)}
            disabled={pending}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus-ring disabled:opacity-50"
          >
            {STATUT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </li>
  );
}
