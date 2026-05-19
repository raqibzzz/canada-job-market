"use client";

import { useState } from "react";
import { Occupation, OccupationGroup, ViewMode } from "../types";
import { educationLabel, formatEmployment, formatWage, getCellColor, growthLabel } from "../utils";

interface Props {
  groups: OccupationGroup[];
  mode: ViewMode;
}

const GROWTH_ORDER: Record<string, number> = {
  above_average: 4, average: 3, stable: 3, below_average: 2, declining: 1,
};

function sorted(occs: Occupation[], mode: ViewMode) {
  return [...occs].sort((a, b) => {
    if (mode === "ai_exposure") return b.ai_score - a.ai_score;
    if (mode === "wage") return b.median_wage - a.median_wage;
    if (mode === "growth") return (GROWTH_ORDER[b.growth] ?? 0) - (GROWTH_ORDER[a.growth] ?? 0);
    return 0;
  });
}

function metricValue(occ: Occupation, mode: ViewMode) {
  if (mode === "ai_exposure") return `${occ.ai_score}/10`;
  if (mode === "wage") return formatWage(occ.median_wage);
  if (mode === "growth") return growthLabel(occ.growth);
  if (mode === "education") return educationLabel(occ.education);
  return "";
}

function OccupationCard({ occ, group, mode }: { occ: Occupation; group: string; mode: ViewMode }) {
  const [expanded, setExpanded] = useState(false);
  const color = getCellColor(occ, mode);

  return (
    <button
      className="w-full text-left rounded-xl overflow-hidden border border-white/8 transition-colors active:bg-white/5"
      style={{ background: "rgba(255,255,255,0.04)" }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Color bar */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ background: color, minHeight: 36 }}
        />

        {/* Name + sub-info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white leading-tight">{occ.name}</div>
          <div className="text-xs text-white/35 mt-0.5">
            {group} · NOC {occ.noc_code}
          </div>
        </div>

        {/* Metric badge */}
        <div
          className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-md"
          style={{ background: color + "28", color }}
        >
          {metricValue(occ, mode)}
        </div>

        {/* Chevron */}
        <svg
          className="flex-shrink-0 text-white/25 transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          width={14} height={14} viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-white/8">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 mb-3">
            <Stat label="Employed" value={formatEmployment(occ.employment)} />
            <Stat label="Median Wage" value={formatWage(occ.median_wage)} />
            <Stat label="Job Growth" value={growthLabel(occ.growth)} />
            <Stat label="Education" value={educationLabel(occ.education)} />
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-white/40 text-xs uppercase tracking-wide">AI Exposure</span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: getCellColor(occ, "ai_exposure") + "30", color: getCellColor(occ, "ai_exposure") }}
            >
              {occ.ai_score}/10
            </span>
          </div>
          <p className="text-white/60 text-xs leading-relaxed">{occ.ai_rationale}</p>
        </div>
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/35 text-xs">{label}</div>
      <div className="text-white text-sm font-medium">{value}</div>
    </div>
  );
}

export default function MobileList({ groups, mode }: Props) {
  return (
    <div className="space-y-6 pb-6">
      {groups.map((group) => (
        <div key={group.name}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-2 px-0.5">
            {group.name}
          </h2>
          <div className="space-y-1.5">
            {sorted(group.children, mode).map((occ) => (
              <OccupationCard key={occ.noc_code + occ.name} occ={occ} group={group.name} mode={mode} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
