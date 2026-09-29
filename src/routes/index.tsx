import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BrainCircuit, HeartPulse, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/cardio/app-shell";
import { UploadPanel } from "@/components/cardio/upload-panel";
import { PrecautionChannel } from "@/components/cardio/results";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CardioNeuro AI — Heart Dataset Screening" },
      {
        name: "description",
        content:
          "Upload a heart dataset and get a real Random Forest screening estimate, heart-rate analysis and precaution guidance.",
      },
      { property: "og:title", content: "CardioNeuro AI — Heart Dataset Screening" },
      {
        property: "og:description",
        content: "Real machine-learning cardiovascular screening from your own CSV dataset.",
      },
    ],
  }),
  component: Index,
});

const highlights = [
  { icon: BrainCircuit, title: "Random Forest engine", body: "Every dataset trains and evaluates a real model on the server." },
  { icon: HeartPulse, title: "Heart-rate analysis", body: "Detects heart-rate columns and charts the real measurements." },
  { icon: Activity, title: "Explainable output", body: "Permutation importance shows which features drove the estimate." },
  { icon: ShieldCheck, title: "Nothing stored", body: "Your file is processed in memory and never saved." },
];

function Index() {
  return (
    <AppShell>
      <section className="mx-auto max-w-[1540px] px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Cardiovascular screening intelligence</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
              Real model analysis of your <span className="text-primary">heart dataset</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              CardioNeuro AI trains a Random Forest classifier on the CSV you upload, evaluates it on a
              held-out split, and reports the true model probability, metrics and heart-rate statistics.
              No mock data, no hardcoded results.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/model">How the model works</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {highlights.map(({ icon: Icon, title, body }) => (
                <div className="panel p-4" key={title}>
                  <Icon className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <UploadPanel />
            <PrecautionChannel />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
