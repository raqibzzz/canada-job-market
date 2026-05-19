"use client";

import { ViewMode } from "../types";

interface Props {
  mode: ViewMode;
}

export default function Legend({ mode }: Props) {
  const items = getLegendItems(mode);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ background: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function getLegendItems(mode: ViewMode) {
  switch (mode) {
    case "ai_exposure":
      return [
        { color: "#15803d", label: "Low (1–2)" },
        { color: "#16a34a", label: "Moderate (3–4)" },
        { color: "#ca8a04", label: "Medium (5–6)" },
        { color: "#ea580c", label: "High (7–8)" },
        { color: "#dc2626", label: "Very High (9–10)" },
      ];
    case "growth":
      return [
        { color: "#16a34a", label: "Above Average" },
        { color: "#2563eb", label: "Average / Stable" },
        { color: "#ea580c", label: "Below Average" },
        { color: "#dc2626", label: "Declining" },
      ];
    case "wage":
      return [
        { color: "#dc2626", label: "< $35k" },
        { color: "#ea580c", label: "$35k–50k" },
        { color: "#ca8a04", label: "$50k–70k" },
        { color: "#2563eb", label: "$70k–100k" },
        { color: "#4ade80", label: "$100k–150k" },
        { color: "#16a34a", label: "$150k+" },
      ];
    case "education":
      return [
        { color: "#dc2626", label: "High School" },
        { color: "#ea580c", label: "College / CÉGEP" },
        { color: "#2563eb", label: "Apprenticeship" },
        { color: "#16a34a", label: "University" },
      ];
  }
}
