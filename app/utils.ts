import { EducationLevel, GrowthOutlook, ViewMode } from "./types";

export function getAiColor(score: number): string {
  if (score >= 8) return "#dc2626";
  if (score >= 6) return "#ea580c";
  if (score >= 4) return "#ca8a04";
  if (score >= 2) return "#16a34a";
  return "#15803d";
}

export function getGrowthColor(growth: GrowthOutlook): string {
  const map: Record<GrowthOutlook, string> = {
    above_average: "#16a34a",
    average: "#2563eb",
    stable: "#2563eb",
    below_average: "#ea580c",
    declining: "#dc2626",
  };
  return map[growth];
}

export function getWageColor(wage: number): string {
  if (wage >= 150000) return "#16a34a";
  if (wage >= 100000) return "#4ade80";
  if (wage >= 70000) return "#2563eb";
  if (wage >= 50000) return "#ca8a04";
  if (wage >= 35000) return "#ea580c";
  return "#dc2626";
}

export function getEducationColor(edu: EducationLevel): string {
  const map: Record<EducationLevel, string> = {
    secondary: "#dc2626",
    college: "#ea580c",
    apprenticeship: "#2563eb",
    university: "#16a34a",
  };
  return map[edu];
}

export function getCellColor(d: {
  ai_score: number;
  growth: GrowthOutlook;
  median_wage: number;
  education: EducationLevel;
}, mode: ViewMode): string {
  switch (mode) {
    case "ai_exposure": return getAiColor(d.ai_score);
    case "growth": return getGrowthColor(d.growth);
    case "wage": return getWageColor(d.median_wage);
    case "education": return getEducationColor(d.education);
  }
}

export function formatWage(wage: number): string {
  return "$" + (wage >= 1000 ? Math.round(wage / 1000) + "k" : wage);
}

export function formatEmployment(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return String(n);
}

export function growthLabel(g: GrowthOutlook): string {
  const map: Record<GrowthOutlook, string> = {
    above_average: "Above Average",
    average: "Average",
    stable: "Stable",
    below_average: "Below Average",
    declining: "Declining",
  };
  return map[g];
}

export function educationLabel(e: EducationLevel): string {
  const map: Record<EducationLevel, string> = {
    secondary: "High School",
    college: "College / CÉGEP",
    apprenticeship: "Apprenticeship",
    university: "University",
  };
  return map[e];
}
