import { AlertTriangle, Activity, Download, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/analysis-context";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const fixed = (value: number | null) => value === null ? "—" : value.toFixed(1);

export function EmptyResults({ title = "Analysis awaiting data" }: { title?: string }) {
  return <div className="panel grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-md border border-primary/40 bg-primary/10"><Activity className="size-6 text-primary" /></span><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Upload a compatible CSV or run the demo dataset to generate real model results and visualizations.</p></div></div>;
}

export function RiskOverview() {
  const { result, downloadReport } = useAnalysis();
  if (!result) return <EmptyResults />;
  const risk = Math.round(result.prediction.riskProbability * 100);
  return (
    <div className="panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">AI risk analysis</p><h2 className="mt-1 text-xl font-bold">Cardiovascular screening estimate</h2></div><Button variant="secondary" size="sm" onClick={downloadReport}><Download className="size-4" />Download report</Button></div>
      <div className="mt-6 grid items-center gap-8 md:grid-cols-[230px_1fr]">
        <div className="risk-ring" style={{ "--risk": `${risk * 3.6}deg` } as React.CSSProperties}><div><strong>{risk}%</strong><span>model probability</span></div></div>
        <div><span className="status-pill"><Sparkles className="size-3.5" />{result.prediction.riskCategory}</span><p className="mt-4 text-sm leading-7 text-muted-foreground">This result is a screening estimate, not a medical diagnosis. The percentage is the model’s mean probability across uploaded records, not medical certainty.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(result.metrics).map(([key, value]) => <div className="metric-cell" key={key}><span>{key === "rocAuc" ? "ROC-AUC" : key.toUpperCase()}</span><strong>{value === null ? "N/A" : percent(value)}</strong></div>)}</div></div>
      </div>
    </div>
  );
}

export function SummaryCards() {
  const { result } = useAnalysis();
  if (!result) return null;
  const cards = [
    { label: "Risk estimate", value: percent(result.prediction.riskProbability), note: result.prediction.riskCategory },
    { label: result.heartRate.kind === "maximum" ? "Mean max heart rate" : "Mean heart rate", value: result.heartRate.found ? `${Math.round(result.heartRate.mean ?? 0)} bpm` : "Not found", note: result.heartRate.label },
    { label: "Resting blood pressure", value: result.indicators.bloodPressure === null ? "Not found" : `${Math.round(result.indicators.bloodPressure)} mmHg`, note: "Dataset mean" },
    { label: "Cholesterol", value: result.indicators.cholesterol === null ? "Not found" : `${Math.round(result.indicators.cholesterol)} mg/dL`, note: "Dataset mean" },
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div className="panel p-4" key={card.label}><p className="text-[11px] font-bold uppercase text-muted-foreground">{card.label}</p><p className="mt-2 text-2xl font-extrabold">{card.value}</p><p className="mt-1 truncate text-[11px] text-muted-foreground" title={card.note}>{card.note}</p></div>)}</div>;
}

export function RiskFactors() {
  const { result } = useAnalysis(); if (!result) return null;
  return <section className="panel p-5"><p className="eyebrow">Explainable model output</p><h2 className="mt-1 text-lg font-bold">Key risk factors</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{result.topFactors.map((factor, index) => <div className="factor-row" key={factor.feature}><span className="factor-index">0{index + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-sm"><strong className="truncate">{factor.label}</strong><span className="text-primary">{percent(factor.importance)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.max(8, factor.importance * 100)}%` }} /></div><p className="mt-1 text-[10px] uppercase text-muted-foreground">{factor.contribution}</p></div></div>)}</div></section>;
}

export function PrecautionChannel() {
  const { result } = useAnalysis();
  return <aside className="panel sticky top-20 overflow-hidden border-primary/30"><div className="border-b border-border bg-primary/8 p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="text-base font-bold">Precaution channel</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">General guidance based on detected dataset patterns.</p></div><div className="space-y-5 p-5">{result ? <>{result.warnings.length > 0 && <div className="space-y-3">{result.warnings.map((warning) => <p key={warning} className="border-l-2 border-warning pl-3 text-xs leading-5">{warning}</p>)}</div>}<ul className="space-y-3">{result.recommendations.map((item) => <li className="flex gap-2 text-xs leading-5 text-muted-foreground" key={item}><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></> : <p className="text-xs leading-5 text-muted-foreground">Guidance will appear after a successful analysis.</p>}<div className="rounded-md border border-destructive/30 bg-destructive/8 p-3"><div className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" /><p className="text-[11px] leading-5">If you are experiencing severe chest pain, severe shortness of breath, fainting, or other potentially serious symptoms, seek emergency medical care immediately.</p></div></div></div></aside>;
}

export function HeartRateChart() {
  const { result } = useAnalysis(); if (!result) return null;
  const hr = result.heartRate;
  return <section className="panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Heart rate analysis</p><h2 className="mt-1 text-lg font-bold">{hr.label}</h2></div>{hr.found && <HeartPulse className="size-5 text-primary" />}</div>{!hr.found ? <p className="mt-6 text-sm text-muted-foreground">Heart-rate data was not found in this dataset.</p> : <><div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">{[["Mean", hr.mean], ["Min", hr.min], ["Max", hr.max], ["Median", hr.median], ["Std dev", hr.standardDeviation], ["Count", hr.count]].map(([label, value]) => <div className="metric-cell" key={String(label)}><span>{label}</span><strong>{typeof value === "number" ? (label === "Count" ? value : fixed(value)) : "—"}</strong></div>)}</div><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={hr.series}><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="index" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} minTickGap={32} /><YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} /><Line type="monotone" dataKey="value" stroke="var(--chart-cyan)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></>}</section>;
}

export function DataCharts() {
  const { result } = useAnalysis(); if (!result) return null;
  return <div className="grid gap-4 xl:grid-cols-2"><section className="panel p-5"><p className="eyebrow">Model distribution</p><h2 className="mt-1 text-lg font-bold">Risk distribution</h2><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={result.riskDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{result.riskDistribution.map((entry, index) => <Cell key={entry.name} fill={["var(--chart-green)", "var(--chart-blue)", "var(--chart-red)"][index]} />)}</Pie><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} /></PieChart></ResponsiveContainer></div></section><section className="panel p-5"><p className="eyebrow">Permutation importance</p><h2 className="mt-1 text-lg font-bold">Feature importance</h2><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={result.featureImportance.slice(0, 6)} layout="vertical" margin={{ left: 10 }}><CartesianGrid stroke="var(--chart-grid)" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" width={118} dataKey="feature" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} formatter={(value) => percent(Number(value))} /><Bar dataKey="importance" fill="var(--chart-cyan)" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div></section></div>;
}
