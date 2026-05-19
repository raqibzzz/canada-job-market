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
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  occupation: Occupation;
  group: string;
  color: string;
}

export default function Treemap({ data, mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<HoveredOcc | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setDims({ width: el.clientWidth, height: el.clientHeight });
    });
    obs.observe(el);
    setDims({ width: el.clientWidth, height: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!dims.width || !dims.height) return { cells: [], groupLabels: [] };

    const hierarchy = d3
      .hierarchy<RawData | OccupationGroup | Occupation>(data as RawData, (d) => {
        if ("children" in d && Array.isArray(d.children)) return d.children as (OccupationGroup | Occupation)[];
        return null;
      })
      .sum((d) => ("employment" in d ? (d as Occupation).employment : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemap = d3
      .treemap<RawData | OccupationGroup | Occupation>()
      .size([dims.width, dims.height])
      .paddingOuter(4)
      .paddingInner(2)
      .paddingTop(20)
      .round(true);

    const root = treemap(hierarchy) as HierarchyRectangularNode<RawData | OccupationGroup | Occupation>;

    const cells: Cell[] = [];
    root.leaves().forEach((leaf) => {
      const occ = leaf.data as Occupation;
      const groupNode = leaf.parent;
      if (!groupNode) return;
      const group = (groupNode.data as OccupationGroup).name;
      cells.push({
        x0: leaf.x0,
        y0: leaf.y0,
        x1: leaf.x1,
        y1: leaf.y1,
        occupation: occ,
        group,
        color: getCellColor(occ, mode),
      });
    });

    const groupLabels = root.children?.map((group) => ({
      name: (group.data as OccupationGroup).name,
      x0: group.x0,
      y0: group.y0,
      x1: group.x1,
      y1: group.y1,
    })) ?? [];

    return { cells, groupLabels };
  }, [data, dims, mode]);

  const { cells, groupLabels } = layout;

  const onMouseMove = useCallback((e: React.MouseEvent, occ: Occupation, group: string) => {
    setHovered({ occupation: occ, group, x: e.clientX, y: e.clientY });
  }, []);

  const onMouseLeave = useCallback(() => setHovered(null), []);

  const onTouchStart = useCallback((e: React.TouchEvent, occ: Occupation, group: string) => {
    const t = e.touches[0];
    setHovered((prev) =>
      prev?.occupation.noc_code === occ.noc_code
        ? null
        : { occupation: occ, group, x: t.clientX, y: t.clientY }
    );
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <svg width={dims.width} height={dims.height} className="absolute inset-0">
        {groupLabels.map((g) => (
          <g key={g.name}>
            <rect
              x={g.x0}
              y={g.y0}
              width={g.x1 - g.x0}
              height={g.y1 - g.y0}
              fill="transparent"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
              rx={4}
            />
            <text
              x={g.x0 + 6}
              y={g.y0 + 13}
              fill="rgba(255,255,255,0.5)"
              fontSize={11}
              fontWeight={600}
              letterSpacing={0.5}
              style={{ textTransform: "uppercase", userSelect: "none" }}
            >
              {g.name}
            </text>
          </g>
        ))}

        {cells.map((cell) => {
          const w = cell.x1 - cell.x0;
          const h = cell.y1 - cell.y0;
          const isHovered =
            hovered?.occupation.noc_code === cell.occupation.noc_code;

          return (
            <g key={cell.occupation.noc_code + cell.occupation.name}>
              <rect
                x={cell.x0 + 1}
                y={cell.y0 + 1}
                width={Math.max(0, w - 2)}
                height={Math.max(0, h - 2)}
                fill={cell.color}
                fillOpacity={isHovered ? 1 : 0.82}
                rx={3}
                stroke={isHovered ? "#fff" : "transparent"}
                strokeWidth={isHovered ? 1.5 : 0}
                style={{ cursor: "default", transition: "fill-opacity 0.1s" }}
                onMouseMove={(e) => onMouseMove(e, cell.occupation, cell.group)}
                onMouseLeave={onMouseLeave}
                onTouchStart={(e) => onTouchStart(e, cell.occupation, cell.group)}
              />
              {w > 60 && h > 28 && (
                <text
                  x={cell.x0 + 6}
                  y={cell.y0 + 20}
                  fill="rgba(255,255,255,0.9)"
                  fontSize={Math.min(12, w / 8)}
                  fontWeight={500}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {cell.occupation.name.length > Math.floor(w / 7)
                    ? cell.occupation.name.slice(0, Math.floor(w / 7) - 1) + "…"
                    : cell.occupation.name}
                </text>
              )}
              {w > 60 && h > 44 && (
                <text
                  x={cell.x0 + 6}
                  y={cell.y0 + 34}
                  fill="rgba(255,255,255,0.55)"
                  fontSize={10}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  AI: {cell.occupation.ai_score}/10
                </text>
              )}
            </g>
          );
        })}
      </svg>

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
