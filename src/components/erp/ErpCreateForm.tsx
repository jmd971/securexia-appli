"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { ERP_TYPES } from "@/types/erp";

const CATEGORIES = ["1", "2", "3", "4", "5"] as const;

export function ErpCreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      codeErp: String(fd.get("codeErp") || ""),
      nom: String(fd.get("nom") || ""),
      typeErp: String(fd.get("typeErp") || ""),
      categorie: String(fd.get("categorie") || ""),
      effectif: Number(fd.get("effectif") || 0),
      adresse: String(fd.get("adresse") || ""),
      commune: String(fd.get("commune") || ""),
      exploitantNom: String(fd.get("exploitantNom") || ""),
      proprietaireNom: String(fd.get("proprietaireNom") || "") || undefined,
      telephone: String(fd.get("telephone") || "") || undefined,
      natureActivite: String(fd.get("natureActivite") || "") || undefined,
    };

    try {
      const res = await fetch("/api/erps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur de création");
      }
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-navy/20 bg-white p-5 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-semibold text-navy">Nouvel ERP</h3>
        <p className="mt-0.5 text-xs text-muted">
          Renseignez l'identité de l'établissement. Vous pourrez programmer une pré-visite ensuite.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Code ERP" name="codeErp" required placeholder="ERP-007" />
        <Field label="Nom de l'établissement" name="nom" required placeholder="Groupe Scolaire …" />

        <SelectField label="Type ERP" name="typeErp" required>
          {Object.entries(ERP_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{k} — {v}</option>
          ))}
        </SelectField>

        <SelectField label="Catégorie" name="categorie" required>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>Catégorie {c}</option>
          ))}
        </SelectField>

        <Field label="Effectif (public + personnel)" name="effectif" type="number" min={1} required />
        <Field label="Commune" name="commune" required placeholder="Les Abymes" />

        <Field label="Adresse" name="adresse" required className="md:col-span-2" placeholder="Rue, lieu-dit, code postal" />

        <Field label="Nom de l'exploitant" name="exploitantNom" required />
        <Field label="Propriétaire (optionnel)" name="proprietaireNom" />

        <Field label="Téléphone" name="telephone" type="tel" placeholder="0590 …" />
        <Field label="Nature de l'activité (optionnel)" name="natureActivite" />
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer l'ERP"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className = "",
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  min?: number;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs ${className}`}>
      <span className="font-medium text-gray-700">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        className="input-field"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  required,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-gray-700">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <select name={name} required={required} className="input-field" defaultValue="">
        <option value="" disabled>
          Sélectionner…
        </option>
        {children}
      </select>
    </label>
  );
}
