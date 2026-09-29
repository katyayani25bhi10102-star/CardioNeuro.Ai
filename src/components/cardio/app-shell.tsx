import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BrainCircuit, Database, FlaskConical, HeartPulse, Info, LayoutDashboard, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AnalysisProvider, useAnalysis } from "@/context/analysis-context";
import { Button } from "@/components/ui/button";
import { DnaBackground } from "./dna-background";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dataset", label: "Dataset", icon: Database },
  { to: "/analysis", label: "Analysis", icon: Activity },
  { to: "/model", label: "AI Model", icon: FlaskConical },
  { to: "/about", label: "About", icon: Info },
] as const;

function ShellInner({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { backendOnline, checkHealth } = useAnalysis();
  const [open, setOpen] = useState(false);
  useEffect(() => { void checkHealth(); }, [checkHealth]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DnaBackground />
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1540px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="mr-auto flex items-center gap-3" aria-label="CardioNeuro AI home">
            <span className="grid size-9 place-items-center rounded-md border border-primary/60 bg-primary/10 shadow-glow"><HeartPulse className="size-5 text-primary" /></span>
            <span className="text-sm font-extrabold uppercase tracking-[0.12em]">CardioNeuro <span className="text-primary">AI</span></span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${path === to ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-3.5" />{label}</Link>)}
          </nav>
          <div className="hidden items-center gap-2 border-l border-border pl-4 sm:flex"><span className={`size-2 rounded-full ${backendOnline ? "bg-success shadow-success" : backendOnline === false ? "bg-destructive" : "bg-muted-foreground"}`} /><span className="text-[11px] font-semibold text-muted-foreground">{backendOnline ? "Backend connected" : backendOnline === false ? "Backend offline" : "Checking backend"}</span></div>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle navigation" onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</Button>
        </div>
        {open && <nav className="grid gap-1 border-t border-border bg-background p-3 lg:hidden">{links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Icon className="size-4" />{label}</Link>)}</nav>}
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 border-t border-border bg-background/85 px-4 py-6 text-center text-xs leading-6 text-muted-foreground"><BrainCircuit className="mx-auto mb-2 size-4 text-primary" />CardioNeuro AI is an educational and research-oriented screening tool. Its predictions are based on the uploaded dataset and machine-learning models and are not a medical diagnosis. For medical concerns or symptoms, consult a qualified healthcare professional.</footer>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <AnalysisProvider><ShellInner>{children}</ShellInner></AnalysisProvider>;
}
