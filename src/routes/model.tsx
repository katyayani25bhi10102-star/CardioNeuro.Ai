import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { AppShell } from "@/components/cardio/app-shell";
import type { MetricSet } from "@/lib/cardio-types";

export const Route = createFileRoute("/model")({
  head: () => ({
    meta: [
      { title: "AI Model — CardioNeuro AI" },
      {
        name: "description",
        content: "How the Random Forest screening model is trained, evaluated and explained.",
      },
      { property: "og:title", content: "AI Model — CardioNeuro AI" },
      { property: "og:description", content: "Random Forest training, validation metrics and feature importance." },
    ],
  }),
  component: ModelPage,
});

type ModelMetrics = {
  model: string;
  trainingSamples: number;
  features: number;
  metrics: MetricSet;
  featureImportance: Array<{ feature: string; importance: number }>;
};

const steps = [
  ["1. Parse", "The CSV is parsed on the server and columns are typed as numeric or categorical."],
  ["2. Encode", "Missing numeric cells are filled with the column median; text values are label-encoded."],
  ["3. Split", "Every fifth row per outcome class is held out so evaluation never sees training data."],
  ["4. Train", "A Random Forest of 80 trees is trained on the remaining rows."],
  ["5. Evaluate", "Accuracy, precision, recall, F1 and ROC-AUC are computed on the held-out split."],
  ["6. Explain", "Permutation importance measures the accuracy drop when each feature is shuffled."],
];

function ModelPage() {
  return (
    <AppShell>
      <ModelBody />
    </AppShell>
  );
}

function ModelBody() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["model-metrics"],
    queryFn: async (): Promise<ModelMetrics> => {
      const response = await fetch("/api/model-metrics");
      if (!response.ok) throw new Error("The model benchmark could not be loaded.");
      return (await response.json()) as ModelMetrics;
    },
  });

  return (
    <div className="mx-auto max-w-[1540px] space-y-4 px-4 py-8 sm:px-6">
      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">Model architecture</p>
        <h1 className="mt-1 text-2xl font-extrabold">Random Forest Classifier</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          The screening estimate is the model's mean predicted probability across the records in your
          dataset. Training, evaluation and explanation all run on the server; the browser only displays
          the returned numbers.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map(([title, body]) => (
            <div className="factor-row" key={title}>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">Live benchmark</p>
        <h2 className="mt-1 text-lg font-bold">Reference dataset performance</h2>
        {isLoading && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Training the benchmark model…
          </p>
        )}
        {error && <p className="mt-4 text-sm text-destructive">The model benchmark could not be loaded.</p>}
        {data && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(data.metrics).map(([key, value]) => (
                <div className="metric-cell" key={key}>
                  <span>{key === "rocAuc" ? "ROC-AUC" : key}</span>
                  <strong>{value === null ? "N/A" : `${Math.round(value * 100)}%`}</strong>
                </div>
              ))}
              <div className="metric-cell">
                <span>Training rows</span>
                <strong>{data.trainingSamples}</strong>
              </div>
              <div className="metric-cell">
                <span>Features</span>
                <strong>{data.features}</strong>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {data.featureImportance.slice(0, 8).map((item) => (
                <div key={item.feature}>
                  <div className="flex justify-between text-xs">
                    <span className="truncate">{item.feature}</span>
                    <span className="text-primary">{Math.round(item.importance * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(4, item.importance * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
