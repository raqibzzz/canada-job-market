"use client";

import { Occupation } from "../types";
import { educationLabel, formatEmployment, formatWage, growthLabel } from "../utils";

interface Props {
  occupation: Occupation | null;
  group: string | null;
  x: number;
  y: number;
}

export default function Tooltip({ occupation, group, x, y }: Props) {
  if (!occupation) return null;

  const score = occupation.ai_score;
  const scoreColor =
    score >= 8 ? "#ef4444" : score >= 6 ? "#f97316" : score >= 4 ? "#eab308" : "#22c55e";

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x + 16, top: y - 8 }}
    >
      <div
        className="rounded-lg shadow-2xl border border-white/10 text-sm"
        style={{
          background: "rgba(15,15,20,0.97)",
          backdropFilter: "blur(8px)",
          maxWidth: 320,
          transform: x > window.innerWidth - 360 ? "translateX(calc(-100% - 32px))" : undefined,
        }}
      >
        <div className="px-4 pt-3 pb-2 border-b border-white/10">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-0.5">{group}</div>
          <div className="font-semibold text-white text-base leading-tight">{occupation.name}</div>
          <div className="text-xs text-white/40 mt-0.5">NOC {occupation.noc_code}</div>
        </div>

        <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
          <Stat label="Employed" value={formatEmployment(occupation.employment)} />
          <Stat label="Median Wage" value={formatWage(occupation.median_wage)} />
          <Stat label="Job Growth" value={growthLabel(occupation.growth)} />
          <Stat label="Education" value={educationLabel(occupation.education)} />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-white/50 text-xs uppercase tracking-wider">AI Exposure</span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: scoreColor + "30", color: scoreColor }}
            >
              {score}/10
            </span>
          </div>
          <p className="text-white/70 text-xs leading-relaxed">{occupation.ai_rationale}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/40 text-xs">{label}</div>
      <div className="text-white text-sm font-medium">{value}</div>
    </div>
  );
}
