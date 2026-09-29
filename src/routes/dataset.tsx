import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cardio/app-shell";
import { UploadPanel } from "@/components/cardio/upload-panel";
import { EmptyResults } from "@/components/cardio/results";
import { useAnalysis } from "@/context/analysis-context";

export const Route = createFileRoute("/dataset")({
  head: () => ({
    meta: [
      { title: "Dataset — CardioNeuro AI" },
      {
        name: "description",
        content: "Inspect the uploaded heart dataset: rows, features, target column and a live preview.",
      },
      { property: "og:title", content: "Dataset — CardioNeuro AI" },
      { property: "og:description", content: "Upload a CSV and inspect its structure before analysis." },
    ],
  }),
  component: DatasetPage,
});

function DatasetPage() {
  return (
    <AppShell>
      <DatasetBody />
    </AppShell>
  );
}

function DatasetBody() {
  const { result } = useAnalysis();
  return (
    <div className="mx-auto max-w-[1540px] space-y-4 px-4 py-8 sm:px-6">
      <UploadPanel />
      {!result ? (
        <EmptyResults title="No dataset loaded yet" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["File", result.dataset.name],
              ["Rows", String(result.dataset.rows)],
              ["Features", String(result.dataset.features)],
              ["Target column", result.dataset.targetColumn],
              ["Empty cells", String(result.dataset.missingValues)],
            ].map(([label, value]) => (
              <div className="panel p-4" key={label}>
                <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
                <p className="mt-2 truncate text-lg font-extrabold" title={value}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <section className="panel p-5">
            <p className="eyebrow">Parsed columns</p>
            <h2 className="mt-1 text-lg font-bold">Detected fields</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.dataset.columns.map((column) => (
                <span className="status-pill" key={column}>
                  {column}
                </span>
              ))}
            </div>
          </section>
          <section className="panel overflow-hidden p-5">
            <p className="eyebrow">First rows</p>
            <h2 className="mt-1 text-lg font-bold">Data preview</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    {result.dataset.columns.map((column) => (
                      <th className="border-b border-border px-3 py-2 font-bold uppercase" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.dataset.preview.map((row, index) => (
                    <tr key={index} className="odd:bg-surface/50">
                      {result.dataset.columns.map((column) => (
                        <td className="border-b border-border/60 px-3 py-2" key={column}>
                          {String(row[column] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
