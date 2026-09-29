import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cardio/app-shell";
import { UploadPanel } from "@/components/cardio/upload-panel";
import {
  DataCharts,
  EmptyResults,
  HeartRateChart,
  PrecautionChannel,
  RiskFactors,
  RiskOverview,
} from "@/components/cardio/results";
import { useAnalysis } from "@/context/analysis-context";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Analysis — CardioNeuro AI" },
      {
        name: "description",
        content: "Detailed heart-rate analysis, risk factors and model charts for the uploaded dataset.",
      },
      { property: "og:title", content: "Analysis — CardioNeuro AI" },
      { property: "og:description", content: "Heart-rate statistics, risk factors and feature importance." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  return (
    <AppShell>
      <AnalysisBody />
    </AppShell>
  );
}

function AnalysisBody() {
  const { result } = useAnalysis();
  return (
    <div className="mx-auto max-w-[1540px] px-4 py-8 sm:px-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {!result ? (
            <>
              <EmptyResults title="Analysis awaiting data" />
              <UploadPanel />
            </>
          ) : (
            <>
              <RiskOverview />
              <HeartRateChart />
              <RiskFactors />
              <DataCharts />
            </>
          )}
        </div>
        <PrecautionChannel />
      </div>
    </div>
  );
}
