"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { HierarchyRectangularNode } from "d3";
import { Occupation, OccupationGroup, RawData, ViewMode } from "../types";
import { getCellColor } from "../utils";
import Tooltip from "./Tooltip";

interface Props {
  data: RawData;
  mode: ViewMode;
}

interface HoveredOcc {
  occupation: Occupation;
  group: string;
  x: number;
  y: number;
}

interface Cell {
  x0: number; y0: number; x1: number; y1: number;
  occupation: Occupation; group: string; color: string;
}

interface SectorRect {
  x0: number; y0: number; x1: number; y1: number; name: string;
}

type Node = RawData | OccupationGroup | Occupation;

function buildLayout(data: RawData, width: number, height: number, mode: ViewMode) {
  const hierarchy = d3
    .hierarchy<Node>(data as RawData, (d) =>
      "children" in d && Array.isArray((d as RawData | OccupationGroup).children)
        ? (d as RawData | OccupationGroup).children as Node[]
        : null
    )
    .sum((d) => ("employment" in d ? (d as Occupation).employment : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const root = d3
    .treemap<Node>()
    .size([width, height])
    .paddingOuter(4)
    .paddingInner(2)
    .paddingTop(20)
    .round(true)(hierarchy) as HierarchyRectangularNode<Node>;

  const cells: Cell[] = root.leaves().map((leaf) => {
    const occ = leaf.data as Occupation;
    const group = (leaf.parent!.data as OccupationGroup).name;
    return { x0: leaf.x0, y0: leaf.y0, x1: leaf.x1, y1: leaf.y1, occ, group, occupation: occ, color: getCellColor(occ, mode) };
  }).map(({ x0, y0, x1, y1, occupation, group, color }) => ({ x0, y0, x1, y1, occupation, group, color }));

  const sectors: SectorRect[] = (root.children ?? []).map((c) => ({
    x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1,
    name: (c.data as OccupationGroup).name,
  }));

  return { cells, sectors };
}

export default function MobileTreemap({ data, mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HoveredOcc | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() =>
      setDims({ width: el.clientWidth, height: el.clientHeight })
    );
    obs.observe(el);
    setDims({ width: el.clientWidth, height: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  const { cells, sectors } = useMemo(() => {
    if (!dims.width || !dims.height) return { cells: [], sectors: [] };
    return buildLayout(data, dims.width, dims.height, mode);
  }, [data, dims, mode]);

  const transform = useMemo(() => {
    if (!zoomed) return "none";
    const s = sectors.find((g) => g.name === zoomed);
    if (!s) return "none";
    const sw = s.x1 - s.x0;
    const sh = s.y1 - s.y0;
    const scale = Math.min(dims.width / sw, dims.height / sh) * 0.92;
    const tx = dims.width / 2 - (s.x0 + sw / 2) * scale;
    const ty = dims.height / 2 - (s.y0 + sh / 2) * scale;
    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, [zoomed, sectors, dims]);

  const onTapSector = useCallback((name: string) => {
    setHovered(null);
    setZoomed((prev) => (prev === name ? null : name));
  }, []);

  const onTouchOcc = useCallback((e: React.TouchEvent, occ: Occupation, group: string) => {
    if (!zoomed) return; // only interactive when zoomed in
    const t = e.touches[0];
    setHovered((prev) =>
      prev?.occupation.noc_code === occ.noc_code
        ? null
        : { occupation: occ, group, x: t.clientX, y: t.clientY }
    );
  }, [zoomed]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-white/5"
      style={{ height: "calc(100svh - 152px)" }}
    >
      {dims.width > 0 && (
        <svg width={dims.width} height={dims.height} className="absolute inset-0">
          <g
            style={{
              transform,
              transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
              transformOrigin: "0 0",
            }}
          >
            {/* Sector backgrounds + labels */}
            {sectors.map((s) => (
              <g key={s.name} onClick={() => onTapSector(s.name)} style={{ cursor: "pointer" }}>
                <rect
                  x={s.x0} y={s.y0}
                  width={s.x1 - s.x0} height={s.y1 - s.y0}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                  rx={4}
                />
                <text
                  x={s.x0 + 6} y={s.y0 + 13}
                  fill={zoomed === s.name ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)"}
                  fontSize={11}
                  fontWeight={700}
                  letterSpacing={0.5}
                  style={{ textTransform: "uppercase", userSelect: "none" }}
                >
                  {s.name}
                  {!zoomed && (
                    <tspan fill="rgba(255,255,255,0.25)" fontSize={9} fontWeight={400}> ›</tspan>
                  )}
                </text>
              </g>
            ))}

            {/* Occupation cells */}
            {cells.map((cell) => {
              const w = cell.x1 - cell.x0;
              const h = cell.y1 - cell.y0;
              const isActive = hovered?.occupation.noc_code === cell.occupation.noc_code;

              return (
                <g key={cell.occupation.noc_code + cell.occupation.name}>
                  <rect
                    x={cell.x0 + 1} y={cell.y0 + 1}
                    width={Math.max(0, w - 2)} height={Math.max(0, h - 2)}
                    fill={cell.color}
                    fillOpacity={isActive ? 1 : 0.82}
                    rx={3}
                    stroke={isActive ? "#fff" : "transparent"}
                    strokeWidth={isActive ? 1.5 : 0}
                    style={{ cursor: zoomed ? "pointer" : "default", transition: "fill 0.35s, fill-opacity 0.1s" }}
                    onTouchStart={(e) => onTouchOcc(e, cell.occupation, cell.group)}
                  />
                  {w > 55 && h > 26 && (
                    <text
                      x={cell.x0 + 6} y={cell.y0 + 19}
                      fill="rgba(255,255,255,0.92)"
                      fontSize={Math.min(12, w / 8)}
                      fontWeight={500}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {cell.occupation.name.length > Math.floor(w / 7)
                        ? cell.occupation.name.slice(0, Math.floor(w / 7) - 1) + "…"
                        : cell.occupation.name}
                    </text>
                  )}
                  {w > 55 && h > 40 && (
                    <text
                      x={cell.x0 + 6} y={cell.y0 + 32}
                      fill="rgba(255,255,255,0.5)"
                      fontSize={10}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      AI: {cell.occupation.ai_score}/10
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* Back button */}
      {zoomed && (
        <button
          onClick={() => { setZoomed(null); setHovered(null); }}
          className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white border border-white/20 backdrop-blur-sm"
          style={{ background: "rgba(10,10,15,0.85)" }}
        >
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All sectors
        </button>
      )}

      {/* Hint when not zoomed */}
      {!zoomed && dims.width > 0 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-white/25 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(10,10,15,0.7)" }}>
            Tap a sector to zoom in
          </span>
        </div>
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
