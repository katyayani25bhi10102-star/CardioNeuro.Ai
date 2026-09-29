import Papa from "papaparse";
import { RandomForestClassifier } from "ml-random-forest";
import type { AnalysisResult, MetricSet } from "./cardio-types";

const TARGET_NAMES = ["target", "label", "outcome", "heartdisease", "heart_disease", "condition", "diagnosis", "num"];
const HR_NAMES = ["heart_rate", "heartrate", "hr", "pulse", "bpm"];
const MAX_HR_NAMES = ["thalach", "maxhr", "max_heart_rate", "maximum_heart_rate"];
const TIME_NAMES = ["timestamp", "time", "datetime", "date"];
const BP_NAMES = ["trestbps", "resting_bp", "restingbloodpressure", "blood_pressure", "bp"];
const CHOL_NAMES = ["chol", "cholesterol", "serum_cholesterol"];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function displayName(value: string) {
  const labels: Record<string, string> = {
    age: "Age", trestbps: "Resting blood pressure", chol: "Cholesterol", thalach: "Maximum heart rate",
    exang: "Exercise-induced angina", oldpeak: "ST depression", cp: "Chest pain type", ca: "Major vessels", sex: "Sex",
  };
  return labels[normalize(value)] ?? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "" || String(value).trim() === "?") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const left = sorted[middle - 1];
  const right = sorted[middle];
  if (right === undefined) return 0;
  return sorted.length % 2 ? right : ((left ?? right) + right) / 2;
}

function metricSet(actual: number[], predicted: number[], probabilities: number[]): MetricSet {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  actual.forEach((value, index) => {
    const pred = predicted[index] ?? 0;
    if (value === 1 && pred === 1) tp += 1;
    else if (value === 0 && pred === 0) tn += 1;
    else if (value === 0 && pred === 1) fp += 1;
    else fn += 1;
  });
  const precision = tp / Math.max(tp + fp, 1);
  const recall = tp / Math.max(tp + fn, 1);
  const ranked = actual.map((value, index) => ({ value, score: probabilities[index] ?? 0 })).sort((a, b) => a.score - b.score);
  const positives = actual.filter((value) => value === 1).length;
  const negatives = actual.length - positives;
  let rankSum = 0;
  ranked.forEach((item, index) => { if (item.value === 1) rankSum += index + 1; });
  const rocAuc = positives && negatives ? (rankSum - positives * (positives + 1) / 2) / (positives * negatives) : null;
  return {
    accuracy: (tp + tn) / Math.max(actual.length, 1),
    precision,
    recall,
    f1: (2 * precision * recall) / Math.max(precision + recall, Number.EPSILON),
    rocAuc,
  };
}

function createDemoCsv() {
  const header = "age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal,target";
  const rows: string[] = [];
  for (let index = 0; index < 72; index += 1) {
    const age = 34 + (index * 7) % 44;
    const sex = index % 3 === 0 ? 0 : 1;
    const cp = index % 4;
    const bp = 102 + (index * 9) % 72;
    const chol = 168 + (index * 13) % 190;
    const fbs = index % 5 === 0 ? 1 : 0;
    const restecg = index % 3;
    const thalach = 188 - ((index * 11) % 78);
    const exang = index % 4 === 0 ? 1 : 0;
    const oldpeak = ((index * 3) % 28) / 10;
    const slope = index % 3;
    const ca = index % 5 === 0 ? 2 : index % 3;
    const thal = 2 + (index % 3);
    const score = (age > 56 ? 2 : 0) + (bp > 145 ? 2 : 0) + (chol > 280 ? 1 : 0) + (thalach < 135 ? 2 : 0) + exang * 2 + (oldpeak > 1.5 ? 2 : 0) + ca;
    const target = score >= 5 ? 1 : 0;
    rows.push([age, sex, cp, bp, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, target].join(","));
  }
  return [header, ...rows].join("\n");
}

export function getDemoCsv() {
  return createDemoCsv();
}

export async function analyzeCsv(csv: string, fileName: string): Promise<AnalysisResult> {
  if (csv.length > 5_000_000) throw new Error("The dataset is larger than 5 MB. Please upload a smaller CSV file.");
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim() });
  if (parsed.errors.length > 5) throw new Error(`The CSV could not be read reliably: ${parsed.errors[0]?.message ?? "malformed rows"}.`);
  const rows = parsed.data.filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
  const columns = parsed.meta.fields?.filter(Boolean) ?? [];
  if (!rows.length || !columns.length) throw new Error("The dataset is empty. Add a header row and at least 20 data rows.");
  if (rows.length < 20) throw new Error("At least 20 rows are required to train and evaluate the screening model reliably.");
  const normalized = new Map(columns.map((column) => [normalize(column), column]));
  const targetColumn = TARGET_NAMES.map((name) => normalized.get(name)).find(Boolean);
  if (!targetColumn) throw new Error("No usable target column was found. Add a binary target, outcome, diagnosis, or heart_disease column.");
  const rawTarget = rows.map((row) => row[targetColumn]);
  const targetValues = Array.from(new Set(rawTarget.map((value) => String(value ?? "").trim()).filter(Boolean)));
  if (targetValues.length !== 2) throw new Error(`The target column “${targetColumn}” must contain exactly two outcome classes.`);
  const positive = targetValues.find((value) => ["1", "yes", "true", "positive", "disease", "present"].includes(value.toLowerCase())) ?? targetValues[1];
  const targets = rawTarget.map((value) => String(value ?? "").trim() === positive ? 1 : 0);
  if (targets.filter(Boolean).length < 4 || targets.filter((value) => value === 0).length < 4) throw new Error("Both target outcomes need at least four rows for model evaluation.");

  const featureColumns = columns.filter((column) => column !== targetColumn && rows.some((row) => String(row[column] ?? "").trim() !== ""));
  if (!featureColumns.length) throw new Error("No usable prediction features were found in this dataset.");
  const encoded = featureColumns.map((column) => {
    const raw = rows.map((row) => row[column]);
    const numeric = raw.map(numberOrNull);
    const numericRatio = numeric.filter((value) => value !== null).length / raw.length;
    if (numericRatio >= 0.75) {
      const available = numeric.filter((value): value is number => value !== null);
      const fill = median(available);
      return numeric.map((value) => value ?? fill);
    }
    const values = Array.from(new Set(raw.map((value) => String(value ?? "Unknown").trim() || "Unknown")));
    const mapping = new Map(values.map((value, index) => [value, index]));
    return raw.map((value) => mapping.get(String(value ?? "Unknown").trim() || "Unknown") ?? 0);
  });
  const matrix = rows.map((_, rowIndex) => featureColumns.map((__, columnIndex) => encoded[columnIndex]?.[rowIndex] ?? 0));
  const testIndexes = targets.flatMap((target, targetIndex) => {
    const classPosition = targets.slice(0, targetIndex + 1).filter((value) => value === target).length;
    return classPosition % 5 === 0 ? [targetIndex] : [];
  });
  const testSet = new Set(testIndexes);
  const trainX = matrix.filter((_, index) => !testSet.has(index));
  const trainY = targets.filter((_, index) => !testSet.has(index));
  const testX = matrix.filter((_, index) => testSet.has(index));
  const testY = targets.filter((_, index) => testSet.has(index));
  const model = new RandomForestClassifier({ nEstimators: 80, maxFeatures: 0.8, replacement: true, seed: 42, noOOB: true });
  model.train(trainX, trainY);
  const testPredictions = model.predict(testX);
  const testProbabilities = model.predictProbability(testX, 1);
  const metrics = metricSet(testY, testPredictions, testProbabilities);
  const allProbabilities = model.predictProbability(matrix, 1);
  const riskProbability = Math.min(1, Math.max(0, mean(allProbabilities)));

  const baseline = metrics.accuracy;
  const importances = featureColumns.map((feature, featureIndex) => {
    const permuted = testX.map((row, rowIndex) => {
      const copy = [...row];
      const source = testX[(rowIndex + 1 + featureIndex) % testX.length];
      copy[featureIndex] = source?.[featureIndex] ?? copy[featureIndex] ?? 0;
      return copy;
    });
    const score = metricSet(testY, model.predict(permuted), model.predictProbability(permuted, 1)).accuracy;
    return { feature, importance: Math.max(0.002, baseline - score) };
  });
  const importanceTotal = importances.reduce((sum, item) => sum + item.importance, 0);
  const normalizedImportance = importances.map((item) => ({ ...item, importance: item.importance / importanceTotal })).sort((a, b) => b.importance - a.importance);
  const topFactors = normalizedImportance.slice(0, 6).map((item, index) => ({
    feature: item.feature,
    label: displayName(item.feature),
    importance: item.importance,
    contribution: index < 2 ? "High contribution" as const : index < 4 ? "Moderate contribution" as const : "Low contribution" as const,
  }));

  const hrColumn = HR_NAMES.map((name) => normalized.get(name)).find(Boolean);
  const maxHrColumn = MAX_HR_NAMES.map((name) => normalized.get(name)).find(Boolean);
  const timeColumn = TIME_NAMES.map((name) => normalized.get(name)).find(Boolean);
  const selectedHr = hrColumn ?? maxHrColumn;
  const hrValues = selectedHr ? rows.map((row) => numberOrNull(row[selectedHr])).filter((value): value is number => value !== null) : [];
  const kind = hrColumn ? "timeseries" as const : maxHrColumn ? "maximum" as const : "none" as const;
  const hrMean = hrValues.length ? mean(hrValues) : null;
  const hrMedian = hrValues.length ? median(hrValues) : null;
  const hrStd = hrMean === null ? null : Math.sqrt(mean(hrValues.map((value) => (value - hrMean) ** 2)));
  const heartRate = {
    found: hrValues.length > 0,
    kind,
    label: kind === "timeseries" ? "Heart-rate measurements" : kind === "maximum" ? "Maximum recorded heart rate in dataset" : "Heart-rate data was not found in this dataset.",
    column: selectedHr ?? null,
    mean: hrMean,
    min: hrValues.length ? Math.min(...hrValues) : null,
    max: hrValues.length ? Math.max(...hrValues) : null,
    median: hrMedian,
    standardDeviation: hrStd,
    count: hrValues.length,
    latest: kind === "timeseries" && timeColumn ? hrValues.at(-1) ?? null : null,
    series: selectedHr ? rows.map((row, index) => ({ index: timeColumn ? String(row[timeColumn] ?? index + 1) : String(index + 1), value: numberOrNull(row[selectedHr]) })).filter((item): item is { index: string; value: number } => item.value !== null).slice(0, 160) : [],
  };

  const bpColumn = BP_NAMES.map((name) => normalized.get(name)).find(Boolean);
  const cholColumn = CHOL_NAMES.map((name) => normalized.get(name)).find(Boolean);
  const averageColumn = (column?: string) => column ? mean(rows.map((row) => numberOrNull(row[column])).filter((value): value is number => value !== null)) : null;
  const bloodPressure = averageColumn(bpColumn);
  const cholesterol = averageColumn(cholColumn);
  const warnings: string[] = [];
  if (bloodPressure !== null && bloodPressure >= 140) warnings.push("Your uploaded data contains elevated blood-pressure values. Consider discussing blood-pressure monitoring with a qualified healthcare professional.");
  if (cholesterol !== null && cholesterol >= 240) warnings.push("Your cholesterol-related measurements may warrant discussion with a healthcare professional.");
  if (riskProbability >= 0.66) warnings.push("Consider seeking professional medical evaluation, especially if you have symptoms or existing cardiovascular risk factors.");
  const recommendations = ["Maintain regular physical activity as appropriate for you.", "Choose a balanced diet and maintain healthy sleep.", "Avoid smoking and limit excessive alcohol.", "Monitor blood pressure and cholesterol with professional guidance."];
  const ageColumn = normalized.get("age");
  const ages = ageColumn ? rows.map((row) => numberOrNull(row[ageColumn])).filter((value): value is number => value !== null) : [];
  const bins = [0, 40, 50, 60, 70, 200];
  const featureDistribution = bins.slice(0, -1).map((start, index) => ({ range: `${start || "<"}${start ? "–" + ((bins[index + 1] ?? 200) - 1) : "40"}`, count: ages.filter((age) => age >= start && age < (bins[index + 1] ?? 200)).length }));

  return {
    dataset: { name: fileName, rows: rows.length, features: featureColumns.length, missingValues: rows.reduce((count, row) => count + columns.filter((column) => numberOrNull(row[column]) === null && !String(row[column] ?? "").trim()).length, 0), targetColumn, columns, preview: rows.slice(0, 5) },
    prediction: { riskProbability, riskCategory: riskProbability < 0.34 ? "Lower estimated risk" : riskProbability < 0.66 ? "Moderate estimated risk" : "Higher estimated risk", model: "Random Forest Classifier", evaluatedRows: testY.length },
    metrics,
    topFactors,
    featureImportance: normalizedImportance.slice(0, 10).map((item) => ({ feature: displayName(item.feature), importance: item.importance })),
    heartRate,
    indicators: { bloodPressure, cholesterol },
    riskDistribution: [{ name: "Lower estimate", value: allProbabilities.filter((value) => value < 0.34).length }, { name: "Moderate estimate", value: allProbabilities.filter((value) => value >= 0.34 && value < 0.66).length }, { name: "Higher estimate", value: allProbabilities.filter((value) => value >= 0.66).length }],
    featureDistribution,
    warnings,
    recommendations,
    processedAt: new Date().toISOString(),
  };
}
