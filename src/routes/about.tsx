import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cardio/app-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CardioNeuro AI" },
      {
        name: "description",
        content: "What CardioNeuro AI does, how your data is handled, and the limits of its screening estimates.",
      },
      { property: "og:title", content: "About — CardioNeuro AI" },
      { property: "og:description", content: "Purpose, privacy and limitations of the CardioNeuro AI screening tool." },
    ],
  }),
  component: AboutPage,
});

const sections = [
  {
    title: "What this tool does",
    body: "CardioNeuro AI trains a Random Forest classifier on the heart dataset you upload, evaluates it on a held-out split, and reports the model's real probability, metrics and heart-rate statistics.",
  },
  {
    title: "How your data is handled",
    body: "Uploaded files are parsed in memory on the server and discarded once the response is sent. Nothing is written to a database or storage.",
  },
  {
    title: "What the dataset needs",
    body: "A header row, at least 20 data rows, and a binary outcome column such as target, outcome, diagnosis or heart_disease. Heart-rate columns like heart_rate or thalach unlock the heart-rate analysis.",
  },
  {
    title: "Limitations",
    body: "Results depend entirely on the quality and size of the uploaded dataset. This is an educational and research-oriented screening tool, not a medical diagnosis.",
  },
];

function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
        <div>
          <p className="eyebrow">About</p>
          <h1 className="mt-2 text-3xl font-extrabold">CardioNeuro AI</h1>
        </div>
        {sections.map((section) => (
          <section className="panel p-5" key={section.title}>
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
          </section>
        ))}
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-xs leading-6">
          If you are experiencing severe chest pain, severe shortness of breath, fainting, or other
          potentially serious symptoms, seek emergency medical care immediately.
        </p>
      </div>
    </AppShell>
  );
}
