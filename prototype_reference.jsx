import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import React from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// ── DESIGN TOKENS ──
const T = {
  navy: "#0F2B46", navyLight: "#1B3A5C", navyMuted: "#2C5477",
  orange: "#E67E22", orangeLight: "#F5B041",
  green: "#1ABC9C", greenDark: "#16A085", greenLight: "#D5F5EE",
  red: "#E74C3C", redLight: "#FDEDEC",
  yellow: "#F1C40F", yellowLight: "#FEF9E7",
  blue: "#3498DB", blueLight: "#EBF5FB",
  bg: "#F4F6F9", card: "#FFFFFF",
  text: "#1A2332", textMuted: "#6B7B8D", textLight: "#94A3B8",
  border: "#E2E8F0", borderLight: "#F1F5F9",
  shadow: "0 1px 3px rgba(15,43,70,0.08)",
};

const SCORE_COLORS = ["", T.red, T.orange, T.yellow, T.blue, T.green];
const SCORE_LABELS = ["", "Critique", "Insuffisant", "Passable", "Satisfaisant", "Conforme"];
const SCORE_BG = ["", T.redLight, "#FEF0E7", T.yellowLight, T.blueLight, T.greenLight];

const I = ({ d, size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);
const Icons = {
  back: <I d={<><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>} />,
  right: <I d={<path d="m9 18 6-6-6-6"/>} />,
  download: <I d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />,
  clipboard: <I d={<><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></>} />,
  target: <I d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>} />,
  upload: <I d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />,
};

const TYPE_LABELS = { J:"Accueil PA/PH", L:"Salles spectacles", M:"Magasins", N:"Restauration", O:"Hôtels", P:"Salles danse/jeux", R:"Enseignement", S:"Bibliothèques", T:"Expositions", U:"Soins/EHPAD", V:"Culte", W:"Bureaux", X:"Sports couverts", Y:"Musées", CTS:"Chapiteaux", EF:"Flottants", GA:"Gares", OA:"Hôtels altitude", PA:"Plein air", PS:"Parkings", REF:"Refuges", SG:"Gonflables" };

const SECTIONS = {
  degagements: { label: "Dégagements & Évacuation", icon: "🚪", weight: 1.2 },
  moyens_secours: { label: "Moyens de secours", icon: "🧯", weight: 1.0 },
  ssi_alarme: { label: "SSI / Alarme", icon: "🔔", weight: 1.1 },
  desenfumage: { label: "Désenfumage", icon: "💨", weight: 0.9 },
  elec_gaz: { label: "Installations techniques", icon: "⚡", weight: 1.0 },
  accessibilite: { label: "Accessibilité PMR", icon: "♿", weight: 0.8 },
  locaux_risques: { label: "Locaux à risques", icon: "☣️", weight: 0.9 },
  documents: { label: "Documentation & Registre", icon: "📋", weight: 0.7 },
};

const NA_SECTS = { CTS:["desenfumage","accessibilite","locaux_risques"], PA:["desenfumage","ssi_alarme","locaux_risques"], EF:["desenfumage","accessibilite"], PS:["accessibilite"], REF:["desenfumage","accessibilite"], OA:["desenfumage"], SG:["desenfumage","accessibilite","locaux_risques"], GA:["locaux_risques"] };

const CHECKLIST = {
  degagements: [
    { id:"d1", label:"Nombre et largeur de dégagements réglementaires", gravity:3 },
    { id:"d2", label:"Issues de secours dégagées et accessibles", gravity:3 },
    { id:"d3", label:"Portes ouvrant dans le sens de l'évacuation", gravity:2 },
    { id:"d4", label:"Barres anti-panique fonctionnelles", gravity:2 },
    { id:"d5", label:"BAES / éclairage de sécurité conforme", gravity:2 },
    { id:"d6", label:"Exercices d'évacuation réalisés (2x/an)", gravity:1 },
  ],
  moyens_secours: [
    { id:"m1", label:"Extincteurs conformes et vérifiés", gravity:2 },
    { id:"m2", label:"RIA conformes (si applicable)", gravity:2 },
    { id:"m3", label:"Personnel formé à la sécurité incendie", gravity:2 },
    { id:"m4", label:"BIE / PI accessibles et conformes", gravity:1 },
    { id:"m5", label:"DAE accessible et maintenu", gravity:1 },
  ],
  ssi_alarme: [
    { id:"s1", label:"Alarme fonctionnelle et audible partout", gravity:3 },
    { id:"s2", label:"Déclencheurs manuels accessibles et signalés", gravity:2 },
    { id:"s3", label:"Détection automatique fonctionnelle", gravity:2 },
    { id:"s4", label:"Asservissements conformes (DAS, désenfumage)", gravity:2 },
    { id:"s5", label:"Formation SSI du personnel exploitant", gravity:1 },
  ],
  desenfumage: [
    { id:"df1", label:"Fonctionnement correct du désenfumage", gravity:3 },
    { id:"df2", label:"Commandes manuelles identifiées", gravity:2 },
    { id:"df3", label:"Ouvrants / exutoires en état", gravity:2 },
  ],
  elec_gaz: [
    { id:"e1", label:"Tableaux électriques sécurisés et accessibles", gravity:2 },
    { id:"e2", label:"Absence de surcharge / multiprises", gravity:2 },
    { id:"e3", label:"Vérification périodique à jour", gravity:2 },
    { id:"e4", label:"Ventilation chaufferies conforme", gravity:1 },
    { id:"e5", label:"Organes de coupure identifiés", gravity:1 },
    { id:"e6", label:"Ascenseur contrôlé et en service", gravity:2 },
  ],
  accessibilite: [
    { id:"a1", label:"Cheminements PMR conformes", gravity:1 },
    { id:"a2", label:"Sanitaires adaptés", gravity:1 },
    { id:"a3", label:"Signalétique PMR en place", gravity:1 },
  ],
  locaux_risques: [
    { id:"l1", label:"Local électrique conforme", gravity:2 },
    { id:"l2", label:"Local déchets conforme", gravity:1 },
    { id:"l3", label:"Stockages combustibles maîtrisés", gravity:2 },
  ],
  documents: [
    { id:"doc1", label:"Registre de sécurité présent et à jour", gravity:2 },
    { id:"doc2", label:"Attestations vérifications à jour", gravity:2 },
    { id:"doc3", label:"Plans d'évacuation affichés et à jour", gravity:1 },
    { id:"doc4", label:"Prescriptions antérieures levées", gravity:3 },
  ],
};

const ERPS = [
  { id:"1", code:"ERP-001", nom:"Groupe Scolaire de Boisvin", type_erp:"R", categorie:"3", effectif:386, nature_activite:"Enseignement (+ type N)", adresse:"Boisvin, 97139", commune:"Les Abymes", proprietaire:"Ville des Abymes", exploitant:"Directrices des écoles", telephone:"0590 82 12 34", scores:{degagements:3,moyens_secours:4,ssi_alarme:4,elec_gaz:2,documents:3,accessibilite:3,locaux_risques:3}, lastVisit:"18/01/2022", nextCommission:"2025-06", prescriptions:[
    {id:"p1",desc:"Instruire le personnel sur la conduite en cas d'incendie (Art. MS 72)",delai:"6 mois",source:"PV 18/01/2022",prio:"haute",statut:"en_retard"},
    {id:"p2",desc:"Exercices pratiques d'évacuation trimestriels (Art. R33)",delai:"Permanent",source:"PV 18/01/2022",prio:"haute",statut:"en_retard"},
    {id:"p3",desc:"Supprimer multiprises / installer prises fixes (Art. EL 11 §7)",delai:"3 mois",source:"PV 18/01/2022",prio:"haute",statut:"en_retard"},
    {id:"p4",desc:"Faire contrôler l'ascenseur par organisme agréé (Art. AS 9)",delai:"Avant commission",source:"PV 18/01/2022",prio:"critique",statut:"en_cours"},
    {id:"p5",desc:"Rendre le DAE accessible en permanence (Art. R.157-1 à 4)",delai:"1 mois",source:"PV 30/01/2025",prio:"haute",statut:"a_faire"},
    {id:"p6",desc:"Débarrasser locaux à risques des stockages combustibles (Art. CO 27-28)",delai:"Immédiat",source:"PV 30/01/2025",prio:"critique",statut:"a_faire"},
    {id:"p7",desc:"Installer flashs lumineux dans les sanitaires (Art. GN 8)",delai:"6 mois",source:"PV 30/01/2025",prio:"moyenne",statut:"a_faire"},
  ]},
  { id:"2", code:"ERP-002", nom:"Salle Aimé Césaire", type_erp:"L", categorie:"2", effectif:800, nature_activite:"Spectacles et réunions", adresse:"45 av. de la Liberté", commune:"Les Abymes", proprietaire:"Ville des Abymes", exploitant:"Service Culturel", telephone:"0590 83 45 67", scores:{degagements:4,moyens_secours:3,ssi_alarme:3,desenfumage:2,elec_gaz:4,documents:3,accessibilite:4,locaux_risques:4}, lastVisit:"15/03/2023", nextCommission:"2026-03", prescriptions:[
    {id:"p10",desc:"Remplacement 2 exutoires désenfumage",delai:"3 mois",source:"PV 15/03/2023",prio:"critique",statut:"en_retard"},
    {id:"p11",desc:"Mise à jour registre de sécurité",delai:"1 mois",source:"PV 15/03/2023",prio:"moyenne",statut:"fait"},
  ]},
  { id:"3", code:"ERP-003", nom:"EHPAD Fleur de Canne", type_erp:"J", categorie:"3", effectif:120, nature_activite:"Hébergement PA dépendantes", adresse:"45 chemin des Bougainvilliers", commune:"Les Abymes", proprietaire:"CCAS", exploitant:"Dr. Célestine MORIN", telephone:"0590 82 76 98", scores:{degagements:3,moyens_secours:2,ssi_alarme:2,desenfumage:3,elec_gaz:3,documents:2,accessibilite:4,locaux_risques:3}, lastVisit:"10/11/2023", nextCommission:"2025-11", prescriptions:[
    {id:"p20",desc:"Formation SSI personnel soignant",delai:"3 mois",source:"PV 10/11/2023",prio:"haute",statut:"en_retard"},
    {id:"p21",desc:"Remplacement détecteurs chambres 12-18",delai:"2 mois",source:"PV 10/11/2023",prio:"critique",statut:"en_retard"},
    {id:"p22",desc:"Plan d'évacuation adapté PMR",delai:"3 mois",source:"PV 10/11/2023",prio:"haute",statut:"en_cours"},
  ]},
  { id:"4", code:"ERP-004", nom:"Complexe sportif Mandela", type_erp:"X", categorie:"2", effectif:1200, nature_activite:"Gymnase et salles de sport", adresse:"Rue du Stade", commune:"Les Abymes", proprietaire:"Ville des Abymes", exploitant:"Service des Sports", telephone:"0590 82 55 43", scores:{degagements:5,moyens_secours:4,ssi_alarme:5,elec_gaz:4,documents:5,accessibilite:4,locaux_risques:4}, lastVisit:"20/06/2024", nextCommission:"2027-06", prescriptions:[] },
  { id:"5", code:"ERP-005", nom:"Médiathèque Paul Niger", type_erp:"S", categorie:"4", effectif:180, nature_activite:"Bibliothèque et médiathèque", adresse:"Place de la Mairie", commune:"Les Abymes", proprietaire:"Ville des Abymes", exploitant:"Service Culturel", telephone:"0590 82 12 90", scores:{degagements:4,moyens_secours:5,ssi_alarme:4,elec_gaz:5,documents:4,accessibilite:5,locaux_risques:5}, lastVisit:"05/09/2024", nextCommission:"2027-09", prescriptions:[
    {id:"p30",desc:"Mettre à jour plans d'évacuation après réaménagement RDC",delai:"2 mois",source:"PV 05/09/2024",prio:"moyenne",statut:"fait"},
  ]},
];

function calcGlobalScore(scores, typeErp) {
  const na = NA_SECTS[typeErp] || [];
  let tw = 0, ws = 0;
  Object.entries(SECTIONS).forEach(([k, sec]) => {
    if (na.includes(k)) return;
    const s = scores[k];
    if (s != null) { tw += sec.weight; ws += s * sec.weight; }
  });
  return tw > 0 ? Math.round((ws / tw) * 10) / 10 : 0;
}

function scoreFromChecklist(items) {
  if (!items || items.length === 0) return 0;
  let wOK = 0, tw = 0;
  items.forEach(i => {
    if (i.statut === "NA") return;
    tw += i.gravity;
    if (i.statut === "OK") wOK += i.gravity;
  });
  if (tw === 0) return 5;
  const r = wOK / tw;
  if (r >= 0.95) return 5; if (r >= 0.80) return 4; if (r >= 0.60) return 3; if (r >= 0.40) return 2; return 1;
}

const Btn = ({ v = "primary", children, onClick, disabled, style }) => {
  const styles = { primary:{background:T.navy,color:"#fff",border:"none"}, success:{background:T.green,color:"#fff",border:"none"}, danger:{background:T.red,color:"#fff",border:"none"}, ghost:{background:"transparent",color:T.navy,border:`1px solid ${T.border}`}, outline:{background:"#fff",color:T.navy,border:`1px solid ${T.navy}`} };
  return <button onClick={onClick} disabled={disabled} style={{...styles[v],padding:"8px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,display:"inline-flex",alignItems:"center",gap:6,transition:"all 0.15s",...style}}>{children}</button>;
};
const Card = ({ children, style }) => <div style={{background:T.card,borderRadius:10,border:`1px solid ${T.border}`,boxShadow:T.shadow,...style}}>{children}</div>;
const ScoreBadge = ({ score, size = "md" }) => { const s = Math.round(score); const sz = size==="lg"?{w:56,h:56,fs:22}:size==="sm"?{w:28,h:28,fs:12}:{w:38,h:38,fs:16}; return <div style={{width:sz.w,height:sz.h,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:SCORE_BG[s]||T.bg,border:`2px solid ${SCORE_COLORS[s]||T.border}`,fontSize:sz.fs,fontWeight:800,color:SCORE_COLORS[s]||T.textMuted}}>{score}</div>; };
const ScoreBar = ({ score, label }) => { const s = Math.round(score); return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:12,color:T.textMuted,width:140,flexShrink:0}}>{label}</span><div style={{flex:1,height:8,background:T.borderLight,borderRadius:4,overflow:"hidden"}}><div style={{width:`${(score/5)*100}%`,height:"100%",background:SCORE_COLORS[s],borderRadius:4,transition:"width 0.4s"}}/></div><span style={{fontSize:13,fontWeight:700,color:SCORE_COLORS[s],width:24,textAlign:"right"}}>{score}</span></div>; };
const StatutBadge = ({ statut }) => { const m={a_faire:{bg:T.blueLight,color:T.blue,label:"À faire"},en_cours:{bg:T.yellowLight,color:"#B8860B",label:"En cours"},fait:{bg:T.greenLight,color:T.greenDark,label:"Fait"},en_retard:{bg:T.redLight,color:T.red,label:"En retard"}}; const s=m[statut]||m.a_faire; return <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:10,background:s.bg,color:s.color}}>{s.label}</span>; };
const PrioBadge = ({ prio }) => { const m={critique:{color:T.red,label:"● Critique"},haute:{color:T.orange,label:"● Haute"},moyenne:{color:T.yellow,label:"● Moyenne"},basse:{color:T.green,label:"● Basse"}}; const p=m[prio]||m.moyenne; return <span style={{fontSize:11,fontWeight:600,color:p.color}}>{p.label}</span>; };

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [erps, setErps] = useState(ERPS);
  const [selectedErp, setSelectedErp] = useState(null);
  const [previsitErp, setPrevisitErp] = useState(null);
  const nav = (p, erp = null) => { setPage(p); if (erp) setSelectedErp(erp); };
  const addErp = (newErp) => { setErps(prev => [...prev, { ...newErp, id: String(Date.now()), scores: {}, prescriptions: [] }]); };
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
      <div style={{ background: T.navy, padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 52 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginRight: 24 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>SECUREXIA</span>
          <span style={{ color: T.orangeLight, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Pré-visite</span>
        </div>
        {[{key:"dashboard",label:"Tableau de bord"},{key:"erps",label:"Parc ERP"},{key:"prescriptions",label:"Prescriptions"}].map(t => (
          <button key={t.key} onClick={() => { setPage(t.key); setSelectedErp(null); }} style={{
            background: page===t.key?"rgba(255,255,255,0.12)":"transparent", color: page===t.key?"#fff":"rgba(255,255,255,0.6)",
            border:"none", padding:"14px 14px", fontSize:13, fontWeight:500, cursor:"pointer",
            borderBottom: page===t.key?"2px solid #fff":"2px solid transparent",
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        {page === "dashboard" && <Dashboard erps={erps} onNav={nav} />}
        {page === "erps" && !selectedErp && <ErpList erps={erps} onSelect={e => nav("erps", e)} onPrevisit={e => { setPrevisitErp(e); setPage("previsite"); }} onAdd={addErp} />}
        {page === "erps" && selectedErp && <ErpDetail erp={selectedErp} onBack={() => { setSelectedErp(null); }} onPrevisit={() => { setPrevisitErp(selectedErp); setPage("previsite"); }} />}
        {page === "prescriptions" && <PrescriptionsPage erps={erps} />}
        {page === "previsite" && previsitErp && <Previsite erp={previsitErp} onBack={() => { setPage("erps"); setPrevisitErp(null); }} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function Dashboard({ erps, onNav }) {
  const allPresc = erps.flatMap(e => e.prescriptions);
  const retard = allPresc.filter(p => p.statut === "en_retard").length;
  const critiques = allPresc.filter(p => p.prio === "critique" && p.statut !== "fait").length;
  const avgScore = (erps.reduce((s, e) => s + calcGlobalScore(e.scores, e.type_erp), 0) / erps.length).toFixed(1);
  const erpsSorted = [...erps].sort((a, b) => calcGlobalScore(a.scores, a.type_erp) - calcGlobalScore(b.scores, b.type_erp));
  const urgentes = allPresc.filter(p => p.statut === "en_retard" || (p.prio === "critique" && p.statut !== "fait")).slice(0, 5);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 20 }}>Tableau de bord — Conformité ERP</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label:"ERP suivis", value:erps.length, color:T.navy },
          { label:"Score moyen", value:`${avgScore}/5`, color:parseFloat(avgScore)>=3.5?T.green:T.orange },
          { label:"Prescriptions en retard", value:retard, color:retard>0?T.red:T.green },
          { label:"Actions critiques", value:critiques, color:critiques>0?T.red:T.green },
        ].map((kpi,i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ fontSize:12, color:T.textMuted, marginBottom:4 }}>{kpi.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:kpi.color }}>{kpi.value}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Scoring par ERP</div>
          {erpsSorted.map(erp => { const gs=calcGlobalScore(erp.scores,erp.type_erp); const s=Math.round(gs); return (
            <div key={erp.id} onClick={() => onNav("erps", erp)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.borderLight}`, cursor:"pointer" }}>
              <ScoreBadge score={gs} size="sm" />
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{erp.nom}</div><div style={{ fontSize:11, color:T.textMuted }}>{erp.type_erp} — Cat. {erp.categorie} — {erp.effectif} pers.</div></div>
              <div style={{ fontSize:11, color:SCORE_COLORS[s], fontWeight:600 }}>{SCORE_LABELS[s]}</div>
            </div>
          ); })}
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Prescriptions urgentes</div>
          {urgentes.length===0 && <div style={{ color:T.green, fontSize:13, padding:20, textAlign:"center" }}>✓ Aucune prescription urgente</div>}
          {urgentes.map((p,i) => { const erp=erps.find(e=>e.prescriptions.some(pr=>pr.id===p.id)); return (
            <div key={i} style={{ padding:"8px 0", borderBottom:`1px solid ${T.borderLight}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}><span style={{ fontSize:11, color:T.textMuted }}>{erp?.nom}</span><StatutBadge statut={p.statut} /></div>
              <div style={{ fontSize:12, marginBottom:2 }}>{p.desc.length>80?p.desc.slice(0,80)+"…":p.desc}</div>
              <div style={{ display:"flex", gap:8 }}><PrioBadge prio={p.prio} /><span style={{ fontSize:11, color:T.textMuted }}>Source: {p.source}</span></div>
            </div>
          ); })}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ERP LIST
// ═══════════════════════════════════════════════════════════
function ErpList({ erps, onSelect, onPrevisit, onAdd }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const emptyErp = { code:"", nom:"", type_erp:"R", categorie:"3", effectif:"", nature_activite:"", adresse:"", commune:"Les Abymes", proprietaire:"", exploitant:"", telephone:"", lastVisit:"—", nextCommission:"" };
  const [form, setForm] = useState(emptyErp);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const canSave = form.nom.trim() && form.adresse.trim() && form.exploitant.trim() && form.effectif;

  const handleSave = () => {
    if (!canSave) return;
    onAdd({ ...form, code: `ERP-${String(erps.length + 1).padStart(3, "0")}`, effectif: parseInt(form.effectif) || 0 });
    setForm(emptyErp);
    setShowForm(false);
  };

  const filtered = erps.filter(e => !search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.commune.toLowerCase().includes(search.toLowerCase()));

  const inp = (label, key, opts = {}) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 3 }}>{label} {opts.required && <span style={{ color: T.red }}>*</span>}</label>
      {opts.type === "select" ? (
        <select value={form[key]} onChange={e => upd(key, e.target.value)} style={{ width: "100%", padding: "7px 10px", border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 13, background: "#fff" }}>
          {opts.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input value={form[key]} onChange={e => upd(key, e.target.value)} placeholder={opts.placeholder || ""} type={opts.inputType || "text"}
          style={{ width: "100%", padding: "7px 10px", border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 13 }} />
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>Parc ERP</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ padding: "8px 14px", border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 220 }} />
          <Btn v="primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 13 }}>+ Nouvel ERP</Btn>
        </div>
      </div>

      {/* ── FORMULAIRE CRÉATION ── */}
      {showForm && (
        <Card style={{ padding: 20, marginBottom: 16, borderLeft: `4px solid ${T.orange}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>Nouvel établissement</div>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.textMuted }}>✕</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {inp("Nom de l'établissement", "nom", { required: true, placeholder: "Ex: Groupe Scolaire de Boisvin" })}
            {inp("Adresse", "adresse", { required: true, placeholder: "Ex: 12 rue de la République" })}
            {inp("Commune", "commune", { placeholder: "Les Abymes" })}
            {inp("Type d'ERP", "type_erp", { type: "select", options: Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: `${k} — ${v}` })) })}
            {inp("Catégorie", "categorie", { type: "select", options: [1,2,3,4,5].map(n => ({ value: String(n), label: `${n}e catégorie` })) })}
            {inp("Effectif total", "effectif", { required: true, inputType: "number", placeholder: "Ex: 386" })}
            {inp("Nature de l'activité", "nature_activite", { placeholder: "Ex: Enseignement sans hébergement" })}
            {inp("Exploitant", "exploitant", { required: true, placeholder: "Ex: Directrice de l'école" })}
            {inp("Propriétaire", "proprietaire", { placeholder: "Ex: Ville des Abymes" })}
            {inp("Téléphone", "telephone", { placeholder: "Ex: 0590 82 12 34" })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.borderLight}` }}>
            <Btn v="ghost" onClick={() => { setForm(emptyErp); setShowForm(false); }}>Annuler</Btn>
            <Btn v="success" disabled={!canSave} onClick={handleSave}>Créer l'ERP</Btn>
          </div>

          {!canSave && <div style={{ fontSize: 11, color: T.orange, marginTop: 6 }}>Remplissez les champs obligatoires (nom, adresse, exploitant, effectif)</div>}
        </Card>
      )}

      {/* ── LISTE ── */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(erp => { const gs = calcGlobalScore(erp.scores, erp.type_erp); const s = Math.round(gs); const na = NA_SECTS[erp.type_erp] || []; const prescR = erp.prescriptions.filter(p => p.statut === "en_retard").length; const hasScores = Object.keys(erp.scores).length > 0; return (
          <Card key={erp.id} style={{ padding: 16, cursor: "pointer" }} onClick={() => onSelect(erp)}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {hasScores ? <ScoreBadge score={gs} size="lg" /> : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: T.borderLight, border: `2px dashed ${T.border}`, fontSize: 10, color: T.textMuted, textAlign: "center", lineHeight: 1.2 }}>Pas de<br/>score</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{erp.nom}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{erp.code}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>Type {erp.type_erp} ({TYPE_LABELS[erp.type_erp]}) — Cat. {erp.categorie} — {erp.effectif} pers. — {erp.commune}</div>
                {hasScores && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(SECTIONS).filter(([k]) => !na.includes(k)).map(([k, sec]) => { const sc = erp.scores[k] || 0; return sc > 0 ? <span key={k} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: SCORE_BG[Math.round(sc)], color: SCORE_COLORS[Math.round(sc)], fontWeight: 600 }}>{sec.icon} {sc}</span> : null; })}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: T.textMuted }}>Dernière visite</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{erp.lastVisit || "—"}</div>
                {prescR > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600, marginTop: 4 }}>⚠ {prescR} en retard</div>}
                <Btn v="outline" onClick={e => { e.stopPropagation(); onPrevisit(erp); }} style={{ marginTop: 8, fontSize: 11, padding: "4px 10px" }}>{Icons.clipboard} Pré-visite</Btn>
              </div>
            </div>
          </Card>
        ); })}
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Aucun ERP trouvé. Créez votre premier établissement.</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ERP DETAIL
// ═══════════════════════════════════════════════════════════
function ErpDetail({ erp, onBack, onPrevisit }) {
  const gs=calcGlobalScore(erp.scores,erp.type_erp); const s=Math.round(gs); const na=NA_SECTS[erp.type_erp]||[];
  const hasScores = Object.keys(erp.scores).length > 0;
  const radarData = Object.entries(SECTIONS).filter(([k])=>!na.includes(k)).map(([k,sec])=>({ section:sec.icon+" "+sec.label.split("/")[0].split(" ").slice(0,2).join(" "), score:erp.scores[k]||0, fullMark:5 }));
  const prescActives=erp.prescriptions.filter(p=>p.statut!=="fait"); const prescFaites=erp.prescriptions.filter(p=>p.statut==="fait");
  const prescRetard=erp.prescriptions.filter(p=>p.statut==="en_retard");

  const exportFicheERP = () => {
    const date = new Date().toLocaleDateString("fr-FR");
    const scColor = SCORE_COLORS[s] || "#999";
    const scLabel = SCORE_LABELS[s] || "Non évalué";
    const prioColor = { critique:"#E74C3C", haute:"#E67E22", moyenne:"#F1C40F", basse:"#1ABC9C" };
    const statutLabel = { a_faire:"À faire", en_cours:"En cours", fait:"Réalisé", en_retard:"EN RETARD" };
    const statutColor = { a_faire:"#3498DB", en_cours:"#B8860B", fait:"#1ABC9C", en_retard:"#E74C3C" };
    const esc = (v) => String(v || "—").replace(/&/g,"&amp;").replace(/</g,"&lt;");

    let h = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dossier ERP — ${esc(erp.nom)}</title>
<style>
@page{size:A4;margin:18mm 15mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;line-height:1.55;color:#222}

/* Print */
.print-bar{display:flex;justify-content:center;gap:10pt;padding:16pt;background:#F4F6F9}
.print-btn{padding:10pt 28pt;font-size:11pt;font-weight:700;border:none;border-radius:6pt;cursor:pointer;background:#0F2B46;color:#fff}
@media print{.print-bar{display:none!important}.page-break{page-break-before:always}}

/* Cover */
.cover{height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40pt;page-break-after:always}
.cover .brand{font-size:28pt;font-weight:800;color:#0F2B46;letter-spacing:3pt;margin-bottom:4pt}
.cover .brand-sub{font-size:10pt;color:#E67E22;letter-spacing:3pt;text-transform:uppercase;margin-bottom:40pt}
.cover .doc-type{font-size:14pt;color:#6B7B8D;text-transform:uppercase;letter-spacing:2pt;margin-bottom:10pt}
.cover .erp-name{font-size:22pt;font-weight:700;color:#0F2B46;margin-bottom:8pt}
.cover .erp-meta{font-size:10pt;color:#6B7B8D;margin-bottom:30pt;line-height:1.8}
.cover .score-hero{display:inline-block;padding:18pt 32pt;border:3pt solid ${scColor};border-radius:10pt}
.cover .score-num{font-size:48pt;font-weight:800;color:${scColor};line-height:1}
.cover .score-lbl{font-size:14pt;font-weight:700;color:${scColor};margin-top:4pt}
.cover .date{font-size:9pt;color:#94A3B8;margin-top:40pt}
.cover .confid{font-size:8pt;color:#E74C3C;font-style:italic;margin-top:6pt}

/* TOC */
.toc{padding:30pt;page-break-after:always}
.toc h2{font-size:16pt;color:#0F2B46;margin-bottom:20pt;border-bottom:2pt solid #0F2B46;padding-bottom:8pt}
.toc-item{display:flex;justify-content:space-between;padding:8pt 0;border-bottom:1pt dotted #E2E8F0;font-size:10pt}
.toc-item .num{font-weight:700;color:#0F2B46;margin-right:8pt}
.toc-item .pg{color:#6B7B8D}

/* Content pages */
.content{padding:20pt 30pt}
.page-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1.5pt solid #0F2B46;padding-bottom:6pt;margin-bottom:16pt}
.page-header .left{font-size:8pt;color:#0F2B46;font-weight:700;letter-spacing:1pt}
.page-header .right{font-size:7pt;color:#6B7B8D}
h3{font-size:13pt;font-weight:700;color:#0F2B46;margin-bottom:12pt}
h4{font-size:11pt;font-weight:700;color:#2C5477;margin:14pt 0 8pt;padding-bottom:3pt;border-bottom:.5pt solid #E2E8F0}

/* Tables */
table.info{width:100%;border-collapse:collapse;margin-bottom:14pt}
table.info td{padding:5pt 10pt;font-size:9.5pt;border-bottom:.5pt solid #E2E8F0}
table.info td:first-child{font-weight:600;color:#6B7B8D;width:160pt}
table.info tr:nth-child(even){background:#F9FAFB}

table.presc{width:100%;border-collapse:collapse;margin:8pt 0}
table.presc th{background:#0F2B46;color:#fff;font-size:8pt;padding:6pt 8pt;text-align:left;font-weight:600}
table.presc td{padding:6pt 8pt;font-size:9pt;border-bottom:.5pt solid #E2E8F0;vertical-align:top}
table.presc tr:nth-child(even){background:#F9FAFB}

/* Score bars */
.score-row{display:flex;align-items:center;gap:6pt;margin-bottom:6pt}
.score-row .lbl{min-width:170pt;font-size:9.5pt}
.score-row .bar{flex:1;height:10pt;background:#E2E8F0;border-radius:5pt;overflow:hidden}
.score-row .bar-fill{height:100%;border-radius:5pt}
.score-row .val{font-weight:800;font-size:10pt;width:36pt;text-align:right}

/* Section detail */
.section-block{margin-bottom:14pt;padding:10pt 12pt;background:#F9FAFB;border-radius:6pt;border-left:3pt solid #E2E8F0}
.section-block.score-1{border-left-color:#E74C3C}.section-block.score-2{border-left-color:#E67E22}
.section-block.score-3{border-left-color:#F1C40F}.section-block.score-4{border-left-color:#3498DB}
.section-block.score-5{border-left-color:#1ABC9C}
.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt}
.section-head .title{font-size:10pt;font-weight:700}
.section-head .badge{font-size:10pt;font-weight:800;padding:2pt 10pt;border-radius:10pt;color:#fff}
.item-row{display:flex;align-items:flex-start;gap:6pt;padding:3pt 0;font-size:9pt}
.item-ok{color:#1ABC9C}.item-nok{color:#E74C3C;font-weight:600}.item-na{color:#94A3B8;font-style:italic}

/* Action boxes */
.action-red{padding:8pt 10pt;margin-bottom:5pt;background:#FDEDEC;border-left:3pt solid #E74C3C;border-radius:0 4pt 4pt 0;font-size:9pt}
.action-blue{padding:8pt 10pt;margin-bottom:5pt;background:#EBF5FB;border-left:3pt solid #3498DB;border-radius:0 4pt 4pt 0;font-size:9pt}
.action-yellow{padding:8pt 10pt;margin-bottom:5pt;background:#FEF9E7;border-left:3pt solid #F1C40F;border-radius:0 4pt 4pt 0;font-size:9pt}

/* Synthèse */
.synth-box{padding:16pt;border:2pt solid ${scColor};border-radius:8pt;text-align:center;margin:16pt auto;max-width:320pt}
.synth-box .num{font-size:44pt;font-weight:800;color:${scColor};line-height:1}
.synth-box .lbl{font-size:13pt;font-weight:700;color:${scColor};margin-top:4pt}

.conclusion{padding:12pt 14pt;border-radius:6pt;font-size:9.5pt;margin:12pt 0;line-height:1.6}
.conclusion-green{background:#D5F5EE;border:1pt solid #1ABC9C}
.conclusion-orange{background:#FEF8F0;border:1pt solid #E67E22}
.conclusion-red{background:#FDEDEC;border:1pt solid #E74C3C}

.sig-row{display:flex;justify-content:space-between;gap:30pt;margin-top:24pt}
.sig-block{flex:1;text-align:center}
.sig-block .role{font-size:9pt;font-weight:600;margin-bottom:4pt}
.sig-block .line{border-bottom:.5pt solid #999;margin-top:44pt;width:80%;margin-left:auto;margin-right:auto}
.sig-block .mention{font-size:7pt;color:#94A3B8;margin-top:4pt}

.footer{text-align:center;font-size:7pt;color:#94A3B8;margin-top:24pt;padding-top:8pt;border-top:.5pt solid #E2E8F0}
.page-num{text-align:right;font-size:7pt;color:#94A3B8;margin-top:4pt}
</style></head><body>`;

    h += `<div class="print-bar"><button class="print-btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>`;

    // ════════════════════════════════
    // PAGE 1 : COUVERTURE
    // ════════════════════════════════
    h += `<div class="cover">
<div class="brand">SECUREXIA</div>
<div class="brand-sub">ERP Sécurité 360°</div>
<div class="doc-type">Dossier de conformité ERP</div>
<div class="erp-name">${esc(erp.nom)}</div>
<div class="erp-meta">
Type ${erp.type_erp} — ${esc(TYPE_LABELS[erp.type_erp])}<br/>
${erp.categorie}e catégorie — ${erp.effectif} personnes<br/>
${esc(erp.adresse)} — ${esc(erp.commune)}
</div>`;
    if (hasScores) {
      h += `<div class="score-hero"><div class="score-num">${gs}/5</div><div class="score-lbl">${scLabel}</div></div>`;
    } else {
      h += `<div style="font-size:12pt;color:#6B7B8D;padding:16pt;border:2pt dashed #E2E8F0;border-radius:10pt">Évaluation en attente de pré-visite</div>`;
    }
    h += `<div class="date">Édité le ${date} — Référence ${esc(erp.code)}</div>
<div class="confid">Document confidentiel — Usage interne collectivité</div>
</div>`;

    // ════════════════════════════════
    // PAGE 2 : SOMMAIRE
    // ════════════════════════════════
    h += `<div class="toc">
<h2>Sommaire</h2>
<div class="toc-item"><div><span class="num">1.</span> Identification de l'établissement</div></div>
<div class="toc-item"><div><span class="num">2.</span> Historique et situation administrative</div></div>
<div class="toc-item"><div><span class="num">3.</span> Évaluation détaillée par section</div></div>
<div class="toc-item"><div><span class="num">4.</span> Prescriptions en cours</div></div>
<div class="toc-item"><div><span class="num">5.</span> Plan d'actions recommandé</div></div>
<div class="toc-item"><div><span class="num">6.</span> Synthèse et recommandations</div></div>
</div>`;

    const pgHead = `<div class="page-header"><div class="left">SECUREXIA — ${esc(erp.nom)}</div><div class="right">Dossier de conformité — ${date}</div></div>`;

    // ════════════════════════════════
    // SECTION 1 : IDENTIFICATION
    // ════════════════════════════════
    h += `<div class="content"><div class="page-break"></div>${pgHead}
<h3>1. Identification de l'établissement</h3>
<table class="info">`;
    [["Nom / Raison sociale", erp.nom], ["Code de référence", erp.code], ["Type d'ERP", `${erp.type_erp} — ${TYPE_LABELS[erp.type_erp]}`], ["Catégorie", `${erp.categorie}e catégorie`], ["Effectif admissible", `${erp.effectif} personnes`], ["Nature de l'activité", erp.nature_activite], ["Adresse", erp.adresse], ["Commune", erp.commune], ["Propriétaire", erp.proprietaire], ["Exploitant / Responsable", erp.exploitant], ["Téléphone", erp.telephone]].forEach(([k,v]) => {
      h += `<tr><td>${k}</td><td>${esc(v)}</td></tr>`;
    });
    h += `</table>`;

    // ════════════════════════════════
    // SECTION 2 : HISTORIQUE
    // ════════════════════════════════
    h += `<h3>2. Historique et situation administrative</h3>
<table class="info">
<tr><td>Dernière visite officielle</td><td>${erp.lastVisit || "—"}</td></tr>
<tr><td>Prochaine commission prévue</td><td><strong style="color:#E67E22">${erp.nextCommission || "—"}</strong></td></tr>
<tr><td>Prescriptions actives</td><td>${prescActives.length} (dont ${prescRetard.length} en retard)</td></tr>
<tr><td>Prescriptions réalisées</td><td>${prescFaites.length}</td></tr>
</table>`;

    if (prescRetard.length > 0) {
      h += `<div style="padding:10pt;background:#FDEDEC;border:1pt solid #E74C3C;border-radius:4pt;margin:10pt 0;font-size:9pt">
<strong style="color:#E74C3C">⚠ Attention :</strong> ${prescRetard.length} prescription(s) du dernier PV n'ont pas été levées dans les délais impartis. Une mise en conformité est impérative avant la prochaine commission.</div>`;
    }

    // ════════════════════════════════
    // SECTION 3 : ÉVALUATION PAR SECTION
    // ════════════════════════════════
    h += `<div class="page-break"></div>${pgHead}
<h3>3. Évaluation détaillée par section</h3>`;

    if (!hasScores) {
      h += `<div style="text-align:center;padding:30pt;color:#6B7B8D;font-size:11pt">Aucune pré-visite réalisée — scores non disponibles.<br/>Lancez une pré-visite depuis l'application pour obtenir le scoring détaillé.</div>`;
    } else {
      // Vue d'ensemble
      h += `<h4>3.1 Vue d'ensemble</h4>`;
      Object.entries(SECTIONS).forEach(([k, sec]) => {
        if (na.includes(k)) { h += `<div style="font-size:9pt;color:#94A3B8;font-style:italic;margin-bottom:3pt">${sec.icon} ${sec.label} — Non applicable (type ${erp.type_erp})</div>`; return; }
        const sc = erp.scores[k] || 0;
        const cl = SCORE_COLORS[Math.round(sc)] || "#999";
        h += `<div class="score-row"><span class="lbl">${sec.icon} ${sec.label}</span><div class="bar"><div class="bar-fill" style="width:${(sc/5)*100}%;background:${cl}"></div></div><span class="val" style="color:${cl}">${sc}/5</span></div>`;
      });

      // Détail par section
      h += `<h4>3.2 Détail par section</h4>`;
      Object.entries(SECTIONS).forEach(([k, sec]) => {
        if (na.includes(k)) return;
        const sc = Math.round(erp.scores[k] || 0);
        const cl = SCORE_COLORS[sc] || "#999";
        const bg = SCORE_BG[sc] || "#F4F6F9";
        const items = CHECKLIST[k] || [];

        h += `<div class="section-block score-${sc}">
<div class="section-head"><span class="title">${sec.icon} ${sec.label}</span><span class="badge" style="background:${cl}">${erp.scores[k] || 0}/5 — ${SCORE_LABELS[sc]}</span></div>`;

        h += `<div style="font-size:8.5pt;color:#6B7B8D;margin-bottom:6pt">Points de contrôle réglementaires (${items.length} items) :</div>`;
        items.forEach(item => {
          h += `<div class="item-row"><span style="font-size:8pt">${"●".repeat(item.gravity)}${"○".repeat(3 - item.gravity)}</span><span>${esc(item.label)}</span></div>`;
        });

        // Commentaire automatique basé sur le score
        if (sc <= 2) {
          h += `<div style="margin-top:6pt;font-size:8.5pt;color:#E74C3C;font-weight:600">→ Section nécessitant une intervention prioritaire</div>`;
        } else if (sc === 3) {
          h += `<div style="margin-top:6pt;font-size:8.5pt;color:#E67E22;font-weight:600">→ Section à améliorer — actions correctives recommandées</div>`;
        }
        h += `</div>`;
      });
    }

    // ════════════════════════════════
    // SECTION 4 : PRESCRIPTIONS
    // ════════════════════════════════
    if (erp.prescriptions.length > 0) {
      h += `<div class="page-break"></div>${pgHead}
<h3>4. Prescriptions en cours</h3>
<p style="font-size:9pt;color:#6B7B8D;margin-bottom:10pt">${prescActives.length} prescription(s) active(s) sur ${erp.prescriptions.length} au total. Les prescriptions proviennent des procès-verbaux officiels des commissions de sécurité.</p>`;

      h += `<table class="presc"><thead><tr><th style="width:25pt">N°</th><th>Description de la prescription</th><th style="width:55pt">Priorité</th><th style="width:55pt">Délai</th><th style="width:58pt">Statut</th><th style="width:70pt">Source</th></tr></thead><tbody>`;
      erp.prescriptions.forEach((p, i) => {
        const pc = prioColor[p.prio] || "#999";
        const sc = statutColor[p.statut] || "#999";
        const sl = statutLabel[p.statut] || p.statut;
        const isDone = p.statut === "fait";
        const isRetard = p.statut === "en_retard";
        h += `<tr style="${isDone ? 'opacity:0.45' : ''}${isRetard ? 'background:#FEF0F0' : ''}">
<td style="text-align:center;font-weight:700">${i + 1}</td>
<td${isDone ? ' style="text-decoration:line-through"' : ''}>${esc(p.desc)}</td>
<td><span style="display:inline-block;width:7pt;height:7pt;border-radius:50%;background:${pc};margin-right:3pt;vertical-align:middle"></span>${p.prio}</td>
<td>${esc(p.delai)}</td>
<td><span style="font-size:7.5pt;font-weight:700;padding:2pt 6pt;border-radius:8pt;background:${sc}18;color:${sc}">${sl}</span></td>
<td style="font-size:8pt;color:#6B7B8D">${esc(p.source)}</td>
</tr>`;
      });
      h += `</tbody></table>`;
    }

    // ════════════════════════════════
    // SECTION 5 : PLAN D'ACTIONS
    // ════════════════════════════════
    h += `<div class="page-break"></div>${pgHead}
<h3>5. Plan d'actions recommandé</h3>
<p style="font-size:9pt;color:#6B7B8D;margin-bottom:12pt">Les actions ci-dessous sont classées par ordre de priorité. Elles visent à préparer l'établissement pour la prochaine visite de la commission de sécurité.</p>`;

    if (prescRetard.length > 0) {
      h += `<h4 style="color:#E74C3C;border-bottom-color:#E74C3C">Priorité 1 — Actions en retard (à réaliser immédiatement)</h4>`;
      prescRetard.forEach((p, i) => {
        h += `<div class="action-red"><strong>${i + 1}.</strong> ${esc(p.desc)}<br/><span style="color:#6B7B8D;font-size:8pt">Délai initial : ${esc(p.delai)} — Source : ${esc(p.source)} — <strong style="color:#E74C3C">DÉLAI DÉPASSÉ</strong></span></div>`;
      });
    }

    const prescAFaire = erp.prescriptions.filter(p => p.statut === "a_faire");
    if (prescAFaire.length > 0) {
      h += `<h4 style="color:#3498DB;border-bottom-color:#3498DB">Priorité 2 — Actions à planifier</h4>`;
      prescAFaire.forEach((p, i) => {
        h += `<div class="action-blue"><strong>${i + 1}.</strong> ${esc(p.desc)}<br/><span style="color:#6B7B8D;font-size:8pt">Délai : ${esc(p.delai)} — Source : ${esc(p.source)}</span></div>`;
      });
    }

    const prescEnCours = erp.prescriptions.filter(p => p.statut === "en_cours");
    if (prescEnCours.length > 0) {
      h += `<h4 style="color:#B8860B;border-bottom-color:#F1C40F">Priorité 3 — Actions en cours (à suivre)</h4>`;
      prescEnCours.forEach((p, i) => {
        h += `<div class="action-yellow"><strong>${i + 1}.</strong> ${esc(p.desc)}<br/><span style="color:#6B7B8D;font-size:8pt">Délai : ${esc(p.delai)} — Source : ${esc(p.source)}</span></div>`;
      });
    }

    if (prescActives.length === 0) {
      h += `<div style="text-align:center;padding:20pt;color:#1ABC9C;font-size:10pt">✓ Aucune action à planifier — Continuer les vérifications réglementaires périodiques</div>`;
    }

    // ════════════════════════════════
    // SECTION 6 : SYNTHÈSE (dernière page)
    // ════════════════════════════════
    h += `<div class="page-break"></div>${pgHead}
<h3>6. Synthèse et recommandations</h3>`;

    if (hasScores) {
      h += `<div class="synth-box"><div class="num">${gs}/5</div><div class="lbl">${scLabel}</div></div>`;
    }

    // Conclusion adaptée au score
    if (gs >= 4.5) {
      h += `<div class="conclusion conclusion-green"><strong>Avis favorable</strong> — L'établissement présente un niveau de conformité satisfaisant. Les vérifications réglementaires sont à jour et les équipements de sécurité sont opérationnels. Maintenir ce niveau en poursuivant les contrôles périodiques et la formation du personnel.</div>`;
    } else if (gs >= 3) {
      h += `<div class="conclusion conclusion-orange"><strong>Avis avec réserves</strong> — L'établissement présente des points d'amélioration identifiés. Les prescriptions listées dans ce dossier doivent être levées dans les délais indiqués afin de garantir un niveau de sécurité satisfaisant lors de la prochaine visite de commission. Un suivi régulier est recommandé.</div>`;
    } else if (hasScores) {
      h += `<div class="conclusion conclusion-red"><strong>Avis défavorable</strong> — L'établissement présente des non-conformités significatives nécessitant une intervention rapide. Les actions de priorité 1 doivent être engagées sans délai. Un point d'avancement avec le consultant est recommandé sous 30 jours.</div>`;
    } else {
      h += `<div class="conclusion conclusion-orange"><strong>Évaluation en attente</strong> — Aucune pré-visite n'a encore été réalisée sur cet établissement. Il est recommandé de programmer une pré-visite terrain dans les meilleurs délais afin d'établir le scoring de conformité et préparer la prochaine commission.</div>`;
    }

    // Rappel réglementaire
    h += `<div style="padding:10pt;background:#F4F6F9;border-radius:4pt;margin:14pt 0;font-size:8.5pt;color:#6B7B8D;line-height:1.6">
<strong>Rappel réglementaire :</strong> Ce dossier est un outil d'aide à la décision et de préparation aux commissions de sécurité. Il ne se substitue en aucun cas au procès-verbal officiel de la commission d'arrondissement. Les prescriptions citées proviennent des PV officiels et doivent être levées conformément aux articles du Code de la Construction et de l'Habitation (CCH) et à l'arrêté du 25 juin 1980 modifié.</div>`;

    // Signatures
    h += `<div class="sig-row">
<div class="sig-block"><div class="role">Le consultant</div><div class="line"></div><div class="mention">Date et signature</div></div>
<div class="sig-block"><div class="role">Le responsable de l'établissement</div><div class="line"></div><div class="mention">Date, signature et cachet</div></div>
<div class="sig-block"><div class="role">Le représentant de la collectivité</div><div class="line"></div><div class="mention">Date, signature et cachet</div></div>
</div>`;

    // Footer final
    h += `<div class="footer">SECUREXIA — ERP Sécurité 360° • Dossier de conformité édité le ${date}<br/>
Référence : ${esc(erp.code)} — Document confidentiel à usage de la collectivité et de l'exploitant</div>`;
    h += `</div></body></html>`;

    try {
      const blob = new Blob([h], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dossier_ERP_${erp.code}_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch(e) { alert("Export impossible dans cet environnement."); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <Btn v="ghost" onClick={onBack}>{Icons.back} Retour</Btn>
        <Btn v="primary" onClick={exportFicheERP}>{Icons.download} Dossier PDF pour le responsable</Btn>
      </div>
      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
          {hasScores ? (
            <div style={{ textAlign:"center" }}><ScoreBadge score={gs} size="lg" /><div style={{ fontSize:11, fontWeight:700, color:SCORE_COLORS[s], marginTop:4 }}>{SCORE_LABELS[s]}</div></div>
          ) : (
            <div style={{ width:56, height:56, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:T.borderLight, border:`2px dashed ${T.border}`, fontSize:9, color:T.textMuted, textAlign:"center" }}>Pas de<br/>score</div>
          )}
          <div style={{ flex:1 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:T.navy, marginBottom:4 }}>{erp.nom}</h2>
            <div style={{ fontSize:13, color:T.textMuted }}>Type {erp.type_erp} ({TYPE_LABELS[erp.type_erp]}) — {erp.categorie}e cat. — {erp.effectif} pers.</div>
            <div style={{ fontSize:12, color:T.textMuted }}>{erp.adresse} — {erp.commune} | Exploitant: {erp.exploitant}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:T.textMuted }}>Dernière visite</div><div style={{ fontSize:14, fontWeight:700 }}>{erp.lastVisit}</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Prochaine commission</div><div style={{ fontSize:14, fontWeight:700, color:T.orange }}>{erp.nextCommission}</div>
            <Btn v="primary" onClick={onPrevisit} style={{ marginTop:10 }}>{Icons.clipboard} Pré-visite</Btn>
          </div>
        </div>
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <Card style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Scoring par section</div>
          {Object.entries(SECTIONS).map(([k,sec]) => na.includes(k)?<div key={k} style={{ fontSize:11, color:T.textLight, marginBottom:4 }}>{sec.icon} {sec.label} — N/A</div>:<ScoreBar key={k} label={`${sec.icon} ${sec.label}`} score={erp.scores[k]||0} />)}
        </Card>
        <Card style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:8 }}>Profil de conformité</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}><PolarGrid stroke={T.borderLight}/><PolarAngleAxis dataKey="section" tick={{fontSize:9,fill:T.textMuted}}/><PolarRadiusAxis domain={[0,5]} tick={{fontSize:9}}/><Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2}/></RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card style={{ padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>Prescriptions ({prescActives.length} active{prescActives.length>1?"s":""})</div>
          <Btn v="ghost" style={{ fontSize:11 }}>{Icons.upload} Importer depuis PV</Btn>
        </div>
        {prescActives.length===0 && <div style={{ textAlign:"center", padding:20, color:T.green, fontSize:13 }}>✓ Aucune prescription active</div>}
        {prescActives.map(p => (
          <div key={p.id} style={{ padding:"10px 0", borderBottom:`1px solid ${T.borderLight}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><div style={{ fontSize:13 }}>{p.desc}</div><StatutBadge statut={p.statut} /></div>
            <div style={{ display:"flex", gap:12, fontSize:11, color:T.textMuted }}><PrioBadge prio={p.prio} /><span>Délai: {p.delai}</span><span>Source: {p.source}</span></div>
          </div>
        ))}
        {prescFaites.length>0 && <details style={{ marginTop:8 }}><summary style={{ fontSize:12, color:T.textMuted, cursor:"pointer" }}>{prescFaites.length} réalisée(s)</summary>{prescFaites.map(p=><div key={p.id} style={{ padding:"6px 0", fontSize:12, color:T.textLight, textDecoration:"line-through" }}>{p.desc}</div>)}</details>}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRESCRIPTIONS GLOBALES
// ═══════════════════════════════════════════════════════════
function PrescriptionsPage({ erps }) {
  const [filter, setFilter] = useState("all");
  const all = erps.flatMap(e => e.prescriptions.map(p => ({ ...p, erp: e.nom })));
  const filtered = filter==="all"?all.filter(p=>p.statut!=="fait"):all.filter(p=>p.statut===filter);
  const counts = { en_retard:all.filter(p=>p.statut==="en_retard").length, a_faire:all.filter(p=>p.statut==="a_faire").length, en_cours:all.filter(p=>p.statut==="en_cours").length, fait:all.filter(p=>p.statut==="fait").length };
  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:700, color:T.navy, marginBottom:16 }}>Suivi des prescriptions</h1>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{key:"all",label:`Actives (${counts.en_retard+counts.a_faire+counts.en_cours})`},{key:"en_retard",label:`En retard (${counts.en_retard})`,color:T.red},{key:"a_faire",label:`À faire (${counts.a_faire})`,color:T.blue},{key:"en_cours",label:`En cours (${counts.en_cours})`,color:"#B8860B"},{key:"fait",label:`Fait (${counts.fait})`,color:T.green}].map(f => (
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{ padding:"6px 14px", borderRadius:16, fontSize:12, fontWeight:600, cursor:"pointer", background:filter===f.key?(f.color||T.navy):T.bg, color:filter===f.key?"#fff":T.textMuted, border:`1px solid ${filter===f.key?"transparent":T.border}` }}>{f.label}</button>
        ))}
      </div>
      <Card>
        {filtered.length===0 && <div style={{ padding:24, textAlign:"center", color:T.textMuted }}>Aucune prescription</div>}
        {filtered.map((p,i) => (
          <div key={i} style={{ padding:"12px 16px", borderBottom:`1px solid ${T.borderLight}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><span style={{ fontSize:11, fontWeight:600, color:T.navy }}>{p.erp}</span><StatutBadge statut={p.statut} /></div>
            <div style={{ fontSize:13, marginBottom:3 }}>{p.desc}</div>
            <div style={{ display:"flex", gap:12, fontSize:11, color:T.textMuted }}><PrioBadge prio={p.prio} /><span>Délai: {p.delai}</span><span>Source: {p.source}</span></div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRÉ-VISITE
// ═══════════════════════════════════════════════════════════
function Previsite({ erp, onBack }) {
  const na = NA_SECTS[erp.type_erp]||[]; const sections = Object.entries(SECTIONS).filter(([k])=>!na.includes(k));
  const [items, setItems] = useState(() => { const st={}; sections.forEach(([k])=>{ st[k]=(CHECKLIST[k]||[]).map(i=>({...i,statut:null,comment:""})); }); return st; });
  const [curSec, setCurSec] = useState(0);
  const [showReport, setShowReport] = useState(false);

  const setStatus = (sk,idx,s) => setItems(p=>{const n={...p};n[sk]=[...n[sk]];n[sk][idx]={...n[sk][idx],statut:s};return n;});
  const setComment = (sk,idx,c) => setItems(p=>{const n={...p};n[sk]=[...n[sk]];n[sk][idx]={...n[sk][idx],comment:c};return n;});

  const scores = {}; sections.forEach(([k])=>{ scores[k]=scoreFromChecklist(items[k]); });
  const globalScore = calcGlobalScore(scores, erp.type_erp);
  const totalItems = sections.reduce((s,[k])=>s+items[k].length,0);
  const filledItems = sections.reduce((s,[k])=>s+items[k].filter(i=>i.statut!==null).length,0);
  const pct = totalItems>0?Math.round((filledItems/totalItems)*100):0;
  const [sKey,sConf] = sections[curSec]||[];

  if (showReport) return <PrevisiteReport erp={erp} scores={scores} globalScore={globalScore} items={items} sections={sections} onBack={()=>setShowReport(false)} />;

  return (
    <div>
      <Btn v="ghost" onClick={onBack} style={{ marginBottom:12 }}>{Icons.back} Retour</Btn>
      <Card style={{ padding:16, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><h2 style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:2 }}>Pré-visite — {erp.nom}</h2><div style={{ fontSize:12, color:T.textMuted }}>Type {erp.type_erp} — Cat. {erp.categorie} — {erp.effectif} pers.</div></div>
          <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:T.textMuted }}>Complétion</div><div style={{ fontSize:20, fontWeight:800, color:pct===100?T.green:T.orange }}>{pct}%</div></div>
        </div>
        <div style={{ height:4, background:T.borderLight, borderRadius:2, marginTop:10 }}><div style={{ height:"100%", width:`${pct}%`, background:pct===100?T.green:T.orange, borderRadius:2, transition:"width 0.3s" }}/></div>
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16 }}>
        <Card style={{ padding:8 }}>
          {sections.map(([k,sec],i) => { const si=items[k]; const filled=si.filter(it=>it.statut!==null).length; const tot=si.length; const sc=scoreFromChecklist(si); const comp=filled===tot; return (
            <div key={k} onClick={()=>setCurSec(i)} style={{ padding:"8px 10px", borderRadius:6, cursor:"pointer", marginBottom:2, background:curSec===i?T.navy:"transparent", color:curSec===i?"#fff":T.text }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><span style={{ fontSize:12, fontWeight:600 }}>{sec.icon} {sec.label.split("/")[0]}</span>{comp && <span style={{ fontSize:11, fontWeight:700, color:curSec===i?T.orangeLight:SCORE_COLORS[Math.round(sc)] }}>{sc}/5</span>}</div>
              <div style={{ fontSize:10, opacity:0.7, marginTop:1 }}>{filled}/{tot}</div>
            </div>
          ); })}
          <div style={{ padding:"10px 8px", marginTop:8, borderTop:`1px solid ${T.border}` }}>
            <Btn v={pct===100?"success":"ghost"} disabled={pct<100} onClick={()=>setShowReport(true)} style={{ width:"100%", justifyContent:"center", fontSize:12 }}>{pct===100?"Voir le rapport":`${100-pct}% restant`}</Btn>
          </div>
        </Card>
        <Card style={{ padding:16 }}>
          {sConf && <>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:14 }}>{sConf.icon} {sConf.label}</div>
            {items[sKey]?.map((item,idx) => (
              <div key={item.id} style={{ padding:"10px 0", borderBottom:`1px solid ${T.borderLight}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div style={{ fontSize:13, flex:1 }}>{item.label} <span style={{ fontSize:10, color:T.textLight }}>({"\u25CF".repeat(item.gravity)}{"\u25CB".repeat(3-item.gravity)})</span></div>
                  <div style={{ display:"flex", gap:4 }}>
                    {["OK","NOK","NA"].map(st => <button key={st} onClick={()=>setStatus(sKey,idx,st)} style={{ padding:"4px 12px", borderRadius:4, fontSize:12, fontWeight:700, cursor:"pointer", border:item.statut===st?"none":`1px solid ${T.border}`, background:item.statut===st?(st==="OK"?T.green:st==="NOK"?T.red:"#aaa"):"#fff", color:item.statut===st?"#fff":T.textMuted }}>{st}</button>)}
                  </div>
                </div>
                {item.statut==="NOK" && <input value={item.comment} onChange={e=>setComment(sKey,idx,e.target.value)} placeholder="Observation..." style={{ width:"100%", padding:"6px 10px", border:`1px solid ${T.border}`, borderRadius:4, fontSize:12, marginTop:4 }} />}
              </div>
            ))}
          </>}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:16 }}>
            <Btn v="ghost" onClick={()=>setCurSec(Math.max(0,curSec-1))} disabled={curSec===0}>{Icons.back} Précédent</Btn>
            {curSec<sections.length-1?<Btn v="primary" onClick={()=>setCurSec(curSec+1)}>Suivant {Icons.right}</Btn>:<Btn v={pct===100?"success":"ghost"} disabled={pct<100} onClick={()=>setShowReport(true)}>{Icons.target} Rapport</Btn>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RAPPORT PRÉ-VISITE
// ═══════════════════════════════════════════════════════════
function PrevisiteReport({ erp, scores, globalScore, items, sections, onBack }) {
  const s = Math.round(globalScore);
  const radarData = sections.map(([k,sec])=>({ section:sec.icon+" "+sec.label.split("/")[0].trim().split(" ").slice(0,2).join(" "), score:scores[k], fullMark:5 }));
  const noks = sections.flatMap(([k,sec])=>items[k].filter(i=>i.statut==="NOK").map(i=>({...i,section:sec.label,sectionIcon:sec.icon})));

  const exportReport = () => {
    let h=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pré-visite — ${erp.nom}</title><style>
@page{size:A4;margin:20mm 16mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10pt;line-height:1.5;color:#222;padding:24pt}
.hdr{text-align:center;border-bottom:3pt solid #0F2B46;padding-bottom:14pt;margin-bottom:22pt}.hdr h1{font-size:18pt;color:#0F2B46;margin-bottom:2pt}.hdr .sub{font-size:10pt;color:#0F2B46}.hdr .meta{font-size:8pt;color:#6B7B8D;margin-top:6pt}
.score-box{text-align:center;padding:16pt;margin:12pt auto;max-width:200pt;border:2pt solid ${SCORE_COLORS[s]};border-radius:6pt}.score-num{font-size:36pt;font-weight:800;color:${SCORE_COLORS[s]}}.score-label{font-size:12pt;font-weight:700;color:${SCORE_COLORS[s]};margin-top:4pt}
.sec{margin-bottom:14pt;page-break-inside:avoid}.sec-t{font-size:11pt;font-weight:bold;color:#0F2B46;border-bottom:.5pt solid #ccc;padding-bottom:3pt;margin-bottom:6pt}
.score-bar{display:flex;align-items:center;gap:6pt;margin-bottom:4pt;font-size:9pt}.bar-bg{flex:1;height:8pt;background:#E2E8F0;border-radius:4pt;overflow:hidden}
.nok{color:#E74C3C;font-size:9pt;padding-left:12pt;margin-bottom:2pt}.action{margin-bottom:6pt;padding:6pt;background:#FEF8F0;border-left:3pt solid #E67E22;font-size:9pt}
.ft{text-align:center;font-size:7pt;color:#94A3B8;margin-top:24pt;padding-top:8pt;border-top:.5pt solid #ddd}
.print-btn{display:block;margin:0 auto 16pt;padding:10pt 28pt;font-size:11pt;font-weight:bold;background:#0F2B46;color:#fff;border:none;border-radius:6pt;cursor:pointer}@media print{.print-btn{display:none!important}body{padding:0}}
</style></head><body><button class="print-btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button>`;

    h+=`<div class="hdr"><h1>RAPPORT DE PRÉ-VISITE</h1><div class="sub">${erp.nom}</div><div class="meta">Type ${erp.type_erp} (${TYPE_LABELS[erp.type_erp]}) — ${erp.categorie}e catégorie — ${erp.effectif} personnes<br/>${erp.adresse} — ${erp.commune} | Exploitant: ${erp.exploitant}<br/>Date: ${new Date().toLocaleDateString("fr-FR")}</div></div>`;
    h+=`<div class="score-box"><div class="score-num">${globalScore}/5</div><div class="score-label">${SCORE_LABELS[s]}</div></div>`;

    h+=`<div class="sec"><div class="sec-t">SCORING PAR SECTION</div>`;
    sections.forEach(([k,sec])=>{ const sc=scores[k]; const cl=SCORE_COLORS[Math.round(sc)]; h+=`<div class="score-bar"><span style="min-width:160pt">${sec.icon} ${sec.label}</span><div class="bar-bg"><div style="width:${(sc/5)*100}%;height:100%;background:${cl};border-radius:4pt"></div></div><strong style="color:${cl};width:30pt;text-align:right">${sc}/5</strong></div>`; });
    h+=`</div>`;

    if(noks.length>0){
      h+=`<div class="sec"><div class="sec-t">POINTS DE NON-CONFORMITÉ (${noks.length})</div>`;
      let last=""; noks.forEach(n=>{ if(n.section!==last){h+=`<div style="font-weight:600;margin-top:6pt;font-size:9pt">${n.sectionIcon} ${n.section}</div>`;last=n.section;} h+=`<div class="nok">✗ ${n.label}${n.comment?` — <em>${n.comment}</em>`:""}</div>`; });
      h+=`</div>`;
      h+=`<div class="sec"><div class="sec-t">ACTIONS RECOMMANDÉES</div>`;
      noks.forEach((n,i)=>{ h+=`<div class="action"><strong>${i+1}.</strong> ${n.label}${n.comment?` — ${n.comment}`:""}<br/><span style="color:#6B7B8D">Section: ${n.section} | Gravité: ${"\u25CF".repeat(n.gravity)}${"\u25CB".repeat(3-n.gravity)}</span></div>`; });
      h+=`</div>`;
    }
    h+=`<div class="ft">SECUREXIA — ERP Sécurité 360° • Pré-visite du ${new Date().toLocaleDateString("fr-FR")}</div></body></html>`;
    try{ const b=new Blob([h],{type:"text/html;charset=utf-8"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=`Previsite_${erp.code}_${new Date().toISOString().split("T")[0]}.html`; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(u),5000); }catch(e){ alert("Export impossible."); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <Btn v="ghost" onClick={onBack}>{Icons.back} Retour à la saisie</Btn>
        <Btn v="primary" onClick={exportReport}>{Icons.download} Exporter le rapport</Btn>
      </div>
      <Card style={{ maxWidth:720, margin:"0 auto", padding:"36px 40px", fontFamily:"Georgia, serif" }}>
        <div style={{ textAlign:"center", borderBottom:`3px solid ${T.navy}`, paddingBottom:14, marginBottom:20 }}>
          <div style={{ fontSize:20, fontWeight:700, color:T.navy }}>RAPPORT DE PRÉ-VISITE</div>
          <div style={{ fontSize:15, color:T.navy, fontWeight:600 }}>{erp.nom}</div>
          <div style={{ fontSize:11, color:T.textMuted, fontFamily:"sans-serif", marginTop:6 }}>Type {erp.type_erp} ({TYPE_LABELS[erp.type_erp]}) — {erp.categorie}e cat. — {erp.effectif} pers. | {erp.commune}</div>
          <div style={{ fontSize:10, color:T.textLight, fontFamily:"sans-serif" }}>Pré-visite du {new Date().toLocaleDateString("fr-FR")}</div>
        </div>
        <div style={{ textAlign:"center", padding:20, margin:"0 auto 20px", border:`2px solid ${SCORE_COLORS[s]}`, borderRadius:8, maxWidth:300 }}>
          <div style={{ fontSize:40, fontWeight:800, color:SCORE_COLORS[s] }}>{globalScore}/5</div>
          <div style={{ fontSize:14, fontWeight:700, color:SCORE_COLORS[s] }}>{SCORE_LABELS[s]}</div>
        </div>
        <div style={{ marginBottom:20 }}>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}><PolarGrid stroke={T.borderLight}/><PolarAngleAxis dataKey="section" tick={{fontSize:8,fill:T.textMuted}}/><PolarRadiusAxis domain={[0,5]} tick={{fontSize:8}}/><Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2}/></RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, borderBottom:`1px solid ${T.border}`, paddingBottom:3, marginBottom:8 }}>Scoring par section</div>
          {sections.map(([k,sec])=><ScoreBar key={k} label={`${sec.icon} ${sec.label}`} score={scores[k]} />)}
        </div>
        {noks.length>0 && <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.red, borderBottom:`1px solid ${T.border}`, paddingBottom:3, marginBottom:8 }}>Points de non-conformité ({noks.length})</div>
          {noks.map((n,i)=><div key={i} style={{ fontSize:12, color:T.red, paddingLeft:12, marginBottom:3 }}>✗ <strong>{n.section}</strong> — {n.label}{n.comment?` — ${n.comment}`:""}</div>)}
        </div>}
        {noks.length>0 && <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.orange, borderBottom:`1px solid ${T.border}`, paddingBottom:3, marginBottom:8 }}>Actions recommandées</div>
          {noks.map((n,i)=><div key={i} style={{ padding:"6px 10px", marginBottom:4, background:"#FEF8F0", borderLeft:`3px solid ${T.orange}`, borderRadius:"0 4px 4px 0", fontSize:12 }}><strong>{i+1}.</strong> {n.label}{n.comment && <span style={{ color:T.textMuted }}> — {n.comment}</span>}<div style={{ fontSize:10, color:T.textLight }}>Gravité: {"\u25CF".repeat(n.gravity)}{"\u25CB".repeat(3-n.gravity)}</div></div>)}
        </div>}
        <div style={{ textAlign:"center", fontSize:9, color:T.textLight, fontFamily:"sans-serif", marginTop:24, paddingTop:8, borderTop:`1px solid ${T.borderLight}` }}>SECUREXIA — ERP Sécurité 360° • Pré-visite du {new Date().toLocaleDateString("fr-FR")}</div>
      </Card>
    </div>
  );
}
