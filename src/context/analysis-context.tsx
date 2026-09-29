import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AnalysisResult } from "@/lib/cardio-types";

type Status = "idle" | "uploading" | "processing" | "ready" | "error";
type AnalysisContextValue = {
  result: AnalysisResult | null;
  status: Status;
  error: string | null;
  backendOnline: boolean | null;
  analyzeFile: (file: File) => Promise<boolean>;
  loadDemo: () => Promise<boolean>;
  checkHealth: () => Promise<void>;
  downloadReport: () => void;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

async function responseJson(response: Response) {
  const payload = await response.json() as AnalysisResult | { error?: string };
  if (!response.ok) throw new Error("error" in payload && payload.error ? payload.error : "The analysis service returned an error.");
  return payload as AnalysisResult;
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const checkHealth = useCallback(async () => {
    try { const response = await fetch("/api/health"); setBackendOnline(response.ok); }
    catch { setBackendOnline(false); }
  }, []);

  const analyzeFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Choose a CSV dataset to continue."); setStatus("error"); return false; }
    if (file.size > 5_000_000) { setError("The dataset is larger than 5 MB."); setStatus("error"); return false; }
    setError(null); setStatus("uploading");
    try {
      const form = new FormData(); form.append("file", file);
      setStatus("processing");
      const payload = await responseJson(await fetch("/api/upload", { method: "POST", body: form }));
      setResult(payload); setStatus("ready"); setBackendOnline(true); return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The dataset could not be analyzed."); setStatus("error"); return false;
    }
  }, []);

  const loadDemo = useCallback(async () => {
    setError(null); setStatus("processing");
    try { const payload = await responseJson(await fetch("/api/demo")); setResult(payload); setStatus("ready"); setBackendOnline(true); return true; }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The demo could not be loaded."); setStatus("error"); setBackendOnline(false); return false; }
  }, []);

  const downloadReport = useCallback(() => {
    if (!result) return;
    const report = [
      "CARDIONEURO AI — SCREENING REPORT", "", `Dataset: ${result.dataset.name}`, `Processed: ${new Date(result.processedAt).toLocaleString()}`,
      `Rows: ${result.dataset.rows}`, `Features: ${result.dataset.features}`, `Target: ${result.dataset.targetColumn}`, "",
      `AI-estimated cardiovascular risk: ${Math.round(result.prediction.riskProbability * 100)}%`, `Category: ${result.prediction.riskCategory}`, `Model: ${result.prediction.model}`, "",
      "KEY FACTORS", ...result.topFactors.map((factor) => `• ${factor.label}: ${factor.contribution} (${Math.round(factor.importance * 100)}%)`), "",
      "GUIDANCE", ...[...result.warnings, ...result.recommendations].map((item) => `• ${item}`), "",
      "CardioNeuro AI is an educational and research-oriented screening tool. Its predictions are based on the uploaded dataset and machine-learning models and are not a medical diagnosis. For medical concerns or symptoms, consult a qualified healthcare professional.",
    ].join("\n");
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "cardioneuro-screening-report.txt"; anchor.click(); URL.revokeObjectURL(url);
  }, [result]);

  const value = useMemo(() => ({ result, status, error, backendOnline, analyzeFile, loadDemo, checkHealth, downloadReport }), [result, status, error, backendOnline, analyzeFile, loadDemo, checkHealth, downloadReport]);
  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return context;
}
