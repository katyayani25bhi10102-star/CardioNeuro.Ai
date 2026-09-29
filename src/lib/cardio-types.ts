export type MetricSet = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number | null;
};

export type Factor = {
  feature: string;
  label: string;
  importance: number;
  contribution: "High contribution" | "Moderate contribution" | "Low contribution";
};

export type HeartRateAnalysis = {
  found: boolean;
  kind: "timeseries" | "maximum" | "none";
  label: string;
  column: string | null;
  mean: number | null;
  min: number | null;
  max: number | null;
  median: number | null;
  standardDeviation: number | null;
  count: number;
  latest: number | null;
  series: Array<{ index: string; value: number }>;
};

export type AnalysisResult = {
  dataset: {
    name: string;
    rows: number;
    features: number;
    missingValues: number;
    targetColumn: string;
    columns: string[];
    preview: Array<Record<string, string | number | null>>;
  };
  prediction: {
    riskProbability: number;
    riskCategory: "Lower estimated risk" | "Moderate estimated risk" | "Higher estimated risk";
    model: string;
    evaluatedRows: number;
  };
  metrics: MetricSet;
  topFactors: Factor[];
  featureImportance: Array<{ feature: string; importance: number }>;
  heartRate: HeartRateAnalysis;
  indicators: {
    bloodPressure: number | null;
    cholesterol: number | null;
  };
  riskDistribution: Array<{ name: string; value: number }>;
  featureDistribution: Array<{ range: string; count: number }>;
  warnings: string[];
  recommendations: string[];
  processedAt: string;
};
