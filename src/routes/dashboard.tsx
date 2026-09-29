import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cardio/app-shell";
import { UploadPanel } from "@/components/cardio/upload-panel";
import {
  DataCharts,
  HeartRateChart,
  PrecautionChannel,
  RiskFactors,
  RiskOverview,
  SummaryCards,
} from "@/components/cardio/results";
import { useAnalysis } from "@/context/analysis-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CardioNeuro AI" },
      {
        name: "description",
        content: "Live screening dashboard with model probability, metrics, charts and precautions.",
      },
      { property: "og:title", content: "Dashboard — CardioNeuro AI" },
      {
        property: "og:description",
        content: "Model probability, evaluation metrics and heart-rate charts for your dataset.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell>
      <DashboardBody />
    </AppShell>
  );
}

function DashboardBody() {
  const { result } = useAnalysis();
  return (
    <div className="mx-auto max-w-[1540px] px-4 py-8 sm:px-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <RiskOverview />
          <SummaryCards />
          {result && <RiskFactors />}
          {result && <HeartRateChart />}
          {result && <DataCharts />}
          {!result && <UploadPanel />}
        </div>
        <PrecautionChannel />
      </div>
    </div>
  );
}
