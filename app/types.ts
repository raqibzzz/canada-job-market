export type GrowthOutlook = "above_average" | "average" | "below_average" | "declining" | "stable";
export type EducationLevel = "secondary" | "college" | "apprenticeship" | "university";
export type ViewMode = "ai_exposure" | "growth" | "wage" | "education";

export interface Occupation {
  name: string;
  noc_code: string;
  employment: number;
  median_wage: number;
  growth: GrowthOutlook;
  education: EducationLevel;
  ai_score: number;
  ai_rationale: string;
}

export interface OccupationGroup {
  name: string;
  noc_code: string;
  children: Occupation[];
}

export interface RawData {
  name: string;
  children: OccupationGroup[];
}
