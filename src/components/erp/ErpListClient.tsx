"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, MapPin, ArrowRight, X } from "lucide-react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ERP_TYPES } from "@/types/erp";
import { ErpCreateForm } from "@/components/erp/ErpCreateForm";

interface ErpRow {
  id: string;
  nom: string;
  codeErp: string;
  typeErp: string;
  categorie: string;
  effectif: number;
  commune: string;
  exploitantNom: string;
  prescriptionsEnRetard: number;
  scoreGlobal: number;
  hasData: boolean;
}

export function ErpListClient({ erps }: { erps: ErpRow[] }) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return erps;
    return erps.filter(
      e =>
        e.nom.toLowerCase().includes(needle) ||
        e.commune.toLowerCase().includes(needle) ||
        e.codeErp.toLowerCase().includes(needle),
    );
  }, [q, erps]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un ERP par nom, commune ou code…"
            className="input-field pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreating(c => !c)}
          className="btn-primary inline-flex items-center gap-2"
        >
          {creating ? <X size={16} /> : <Plus size={16} />}
          {creating ? "Annuler" : "Nouvel ERP"}
        </button>
      </div>

      {creating && <ErpCreateForm onSuccess={() => setCreating(false)} />}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted-light text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">ERP</th>
              <th className="px-4 py-3">Type / Cat.</th>
              <th className="px-4 py-3">Commune</th>
              <th className="px-4 py-3 text-right">Effectif</th>
              <th className="px-4 py-3 text-center">Prescriptions en retard</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                  Aucun ERP ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              filtered.map(erp => (
                <tr key={erp.id} className="transition-colors hover:bg-muted-light/60">
                  <td className="px-4 py-3">
                    <Link href={`/erp/${erp.id}`} className="block">
                      <p className="font-semibold text-navy">{erp.nom}</p>
                      <p className="text-xs text-muted">{erp.codeErp} · {erp.exploitantNom}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    <span className="badge bg-navy/10 text-navy">{erp.typeErp}</span>
                    <span className="ml-2 text-muted">Cat. {erp.categorie}</span>
                    <p className="mt-1 text-[11px] text-muted">{ERP_TYPES[erp.typeErp as keyof typeof ERP_TYPES] ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-muted" />
                      {erp.commune}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{erp.effectif}</td>
                  <td className="px-4 py-3 text-center">
                    {erp.prescriptionsEnRetard > 0 ? (
                      <span className="badge bg-danger-light text-danger">
                        {erp.prescriptionsEnRetard} en retard
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {erp.hasData ? (
                      <ScoreBadge score={erp.scoreGlobal} size="sm" />
                    ) : (
                      <span className="text-xs text-muted">Non évalué</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/erp/${erp.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline"
                    >
                      Fiche <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
