import { FileCheck2, FlaskConical, LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/analysis-context";

export function UploadPanel({ compact = false }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { analyzeFile, loadDemo, status, error, result } = useAnalysis();
  const [dragging, setDragging] = useState(false);
  const busy = status === "uploading" || status === "processing";
  const handleFile = async (file?: File) => { if (file && await analyzeFile(file)) void navigate({ to: "/dashboard" }); };
  const drop = (event: DragEvent) => { event.preventDefault(); setDragging(false); void handleFile(event.dataTransfer.files[0]); };
  return (
    <section className={`panel ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><p className="eyebrow">Secure in-memory processing</p><h2 className="mt-1 text-lg font-bold">Upload heart dataset</h2></div>
        {result && <span className="status-pill"><FileCheck2 className="size-3.5" />Ready</span>}
      </div>
      <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} className={`grid min-h-44 place-items-center rounded-md border border-dashed p-5 text-center transition-colors ${dragging ? "border-primary bg-primary/10" : "border-border bg-surface/60"}`}>
        <div>
          <span className="mx-auto grid size-11 place-items-center rounded-md border border-primary/50 bg-primary/10"><UploadCloud className="size-5 text-primary" /></span>
          <p className="mt-3 text-sm font-semibold">Drop a CSV dataset here</p>
          <p className="mt-1 text-xs text-muted-foreground">Binary target required · Maximum 5 MB</p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} aria-label="Choose CSV dataset" />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}{status === "uploading" ? "Uploading" : status === "processing" ? "Processing" : "Choose CSV"}</Button>
            <Button size="sm" variant="secondary" onClick={async () => { if (await loadDemo()) void navigate({ to: "/dashboard" }); }} disabled={busy}><FlaskConical className="size-4" />Load demo dataset</Button>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5 text-destructive-foreground">{error}</p>}
    </section>
  );
}
