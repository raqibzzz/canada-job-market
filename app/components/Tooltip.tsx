"use client";

import { useEffect, useRef, useState } from "react";
import { Occupation } from "../types";
import { educationLabel, formatEmployment, formatWage, growthLabel } from "../utils";

interface Props {
  occupation: Occupation | null;
  group: string | null;
  x: number;
  y: number;
}

export default function Tooltip({ occupation, group, x, y }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 16, top: y - 8 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x + 16;
    let top = y - 8;

    if (left + width > vw - pad) left = x - width - 16;
    if (left < pad) left = pad;
    if (top + height > vh - pad) top = vh - height - pad;
    if (top < pad) top = pad;

    setPos({ left, top });
  }, [x, y]);

  if (!occupation) return null;

  const score = occupation.ai_score;
  const scoreColor =
    score >= 8 ? "#ef4444" : score >= 6 ? "#f97316" : score >= 4 ? "#eab308" : "#22c55e";

  return (
    <div
      ref={ref}
      className="fixed z-50 pointer-events-none"
      style={{ left: pos.left, top: pos.top }}
    >
      <div
        className="rounded-lg shadow-2xl border border-white/10 text-sm"
        style={{
          background: "rgba(15,15,20,0.97)",
          backdropFilter: "blur(8px)",
          maxWidth: 320,
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
