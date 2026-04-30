"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatutBadge } from "@/components/ui/StatutBadge";
import { PrioBadge } from "@/components/ui/PrioBadge";
import { Search } from "lucide-react";

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "actives", label: "Actives" },
  { value: "en_retard", label: "En retard" },
  { value: "a_faire", label: "À faire" },
  { value: "en_cours", label: "En cours" },
  { value: "fait", label: "Fait" },
] as const;

type FilterKey = (typeof FILTERS)[number]["value"];

interface PrescriptionRow {
  id: string;
  description: string;
  delai: string | null;
  responsable: string | null;
  priorite: string;
  statut: string;
  erp: { id: string; nom: string; commune: string };
}

const STATUT_OPTIONS = ["a_faire", "en_cours", "fait", "en_retard"] as const;

export function PrescriptionsClient({ prescriptions }: { prescriptions: PrescriptionRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterKey>("actives");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const byFilter = prescriptions.filter(p => {
      if (filter === "all") return true;
      if (filter === "actives") return p.statut !== "fait";
      return p.statut === filter;
    });
    const needle = q.trim().toLowerCase();
    if (!needle) return byFilter;
    return byFilter.filter(
      p =>
        p.description.toLowerCase().includes(needle) ||
        p.erp.nom.toLowerCase().includes(needle),
    );
  }, [prescriptions, filter, q]);

  function updateStatut(id: string, statut: string) {
    startTransition(async () => {
      await fetch(`/api/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher une prescription ou un ERP…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white p-1 text-xs">
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                filter === f.value
                  ? "bg-navy text-white"
                  : "text-gray-700 hover:bg-muted-light"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted-light text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">ERP</th>
              <th className="px-4 py-3">Délai</th>
              <th className="px-4 py-3">Priorité</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                  Aucune prescription ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-800">{p.description}</p>
                    {p.responsable && (
                      <p className="mt-0.5 text-xs text-muted">Resp. : {p.responsable}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/erp/${p.erp.id}`}
                      className="text-xs font-medium text-navy hover:underline"
                    >
                      {p.erp.nom}
                    </Link>
                    <p className="text-[11px] text-muted">{p.erp.commune}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{p.delai ?? "—"}</td>
                  <td className="px-4 py-3"><PrioBadge priorite={p.priorite} /></td>
                  <td className="px-4 py-3"><StatutBadge statut={p.statut} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={p.statut}
                      onChange={e => updateStatut(p.id, e.target.value)}
                      disabled={pending}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus-ring disabled:opacity-50"
                    >
                      {STATUT_OPTIONS.map(s => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
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
