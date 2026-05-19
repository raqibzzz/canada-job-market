"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { HierarchyCircularNode } from "d3";
import { Occupation, OccupationGroup, RawData, ViewMode } from "../types";
import { getCellColor } from "../utils";
import Tooltip from "./Tooltip";

interface Props {
  data: RawData;
  mode: ViewMode;
}

interface Hovered {
  occupation: Occupation;
  group: string;
  x: number;
  y: number;
}

interface Bubble {
  x: number; y: number; r: number;
  occ: Occupation; group: string; color: string;
}

interface Sector {
  x: number; y: number; r: number; name: string;
}

type Node = RawData | OccupationGroup | Occupation;

function isOccupation(d: Node): d is Occupation { return "employment" in d; }
function isGroup(d: Node): d is OccupationGroup { return "noc_code" in d && "children" in d; }

export default function MobileBubbles({ data, mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<Hovered | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setWidth(el.clientWidth));
    obs.observe(el);
    setWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const { bubbles, sectors, height } = useMemo(() => {
    if (!width) return { bubbles: [] as Bubble[], sectors: [] as Sector[], height: 0 };

    const h = Math.round(width * 1.55);

    const hierarchy = d3
      .hierarchy<Node>(data as RawData, (d) =>
        "children" in d && Array.isArray((d as RawData | OccupationGroup).children)
          ? (d as RawData | OccupationGroup).children as Node[]
          : null
      )
      .sum((d) => (isOccupation(d) ? d.employment : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = d3
      .pack<Node>()
      .size([width, h])
      .padding(10)(hierarchy) as HierarchyCircularNode<Node>;

    const bubbles: Bubble[] = root.leaves().map((leaf) => {
      const occ = leaf.data as Occupation;
      const group = isGroup(leaf.parent!.data) ? leaf.parent!.data.name : "";
      return { x: leaf.x, y: leaf.y, r: leaf.r, occ, group, color: getCellColor(occ, mode) };
    });

    const sectors: Sector[] = (root.children ?? []).map((c) => ({
      x: c.x, y: c.y, r: c.r,
      name: isGroup(c.data) ? c.data.name : "",
    }));

    return { bubbles, sectors, height: h };
  }, [data, width, mode]);

  const onTouchStart = useCallback((e: React.TouchEvent, occ: Occupation, group: string) => {
    const t = e.touches[0];
    setHovered((prev) =>
      prev?.occupation.noc_code === occ.noc_code
        ? null
        : { occupation: occ, group, x: t.clientX, y: t.clientY }
    );
  }, []);

  return (
    <div ref={containerRef} className="relative w-full pb-6">
      {width > 0 && (
        <svg width={width} height={height} style={{ display: "block" }}>
          {/* Sector boundary circles */}
          {sectors.map((s) => (
            <g key={s.name}>
              <circle
                cx={s.x} cy={s.y} r={s.r}
                fill="rgba(255,255,255,0.025)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              <text
                x={s.x}
                y={s.y - s.r + 16}
                textAnchor="middle"
                fill="rgba(255,255,255,0.38)"
                fontSize={9}
                fontWeight={700}
                letterSpacing={1}
                style={{ textTransform: "uppercase", userSelect: "none", pointerEvents: "none" }}
              >
                {s.name}
              </text>
            </g>
          ))}

          {/* Occupation bubbles */}
          {bubbles.map((b) => {
            const isActive = hovered?.occupation.noc_code === b.occ.noc_code;
            const maxChars = Math.max(0, Math.floor((b.r * 1.6) / 7));
            const label = b.occ.name.length > maxChars
              ? b.occ.name.slice(0, maxChars - 1) + "…"
              : b.occ.name;

            return (
              <g key={b.occ.noc_code + b.occ.name}>
                <circle
                  cx={b.x} cy={b.y} r={Math.max(0, b.r - 1)}
                  fill={b.color}
                  fillOpacity={isActive ? 1 : 0.82}
                  stroke={isActive ? "#fff" : "rgba(0,0,0,0.25)"}
                  strokeWidth={isActive ? 2 : 0.5}
                  style={{ cursor: "pointer", transition: "fill 0.35s, fill-opacity 0.15s" }}
                  onTouchStart={(e) => onTouchStart(e, b.occ, b.group)}
                />
                {b.r >= 22 && (
                  <text
                    x={b.x}
                    y={b.r >= 32 ? b.y - 5 : b.y + 4}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.92)"
                    fontSize={Math.min(11, b.r * 0.38)}
                    fontWeight={600}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {label}
                  </text>
                )}
                {b.r >= 32 && (
                  <text
                    x={b.x} y={b.y + 11}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.5)"
                    fontSize={9}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    AI {b.occ.ai_score}/10
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {hovered && (
        <Tooltip
          occupation={hovered.occupation}
          group={hovered.group}
          x={hovered.x}
          y={hovered.y}
          onDismiss={() => setHovered(null)}
        />
      )}
    </div>
  );
}
