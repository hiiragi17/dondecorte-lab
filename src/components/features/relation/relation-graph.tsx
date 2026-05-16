"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type D3DragEvent,
  type D3ZoomEvent,
  drag as d3drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
  zoom as d3zoom,
  zoomIdentity,
  type ZoomTransform,
} from "d3";
import type {
  CoAppearanceGraph,
  CoAppearanceGraphNode,
} from "@/lib/queries/co-appearance-graph";
import type { CastType } from "@/lib/types";

const WIDTH = 928;
const HEIGHT = 680;

const PERFORMER_PATH: Record<CastType, string> = {
  artist: "artists",
  comedy_group: "combos",
  unit: "units",
};

const TYPE_LABEL: Record<CastType, string> = {
  artist: "芸人",
  comedy_group: "コンビ",
  unit: "ユニット",
};

const NODE_FILL: Record<CastType, string> = {
  comedy_group: "#6BB8D4",
  artist: "#E0B074",
  unit: "#C98FB0",
};

const CENTER_FILL = "#F0DFC8";

const GRAPH_BG_COLOR = "#2C1E14";
const NODE_STROKE_COLOR = GRAPH_BG_COLOR;
const HOVER_STROKE_COLOR = CENTER_FILL;
const HIGHLIGHT_COLOR = NODE_FILL.comedy_group;
const LINK_COLOR = "#5A4434";
const LABEL_COLOR = "#D4B896";

type SimNode = SimulationNodeDatum & CoAppearanceGraphNode;
type SimLink = SimulationLinkDatum<SimNode> & { weight: number };

function performerHref(node: CoAppearanceGraphNode): string {
  return `/${PERFORMER_PATH[node.performer.type]}/${node.performer.id}`;
}

function endpoint(value: SimLink["source"]): SimNode | null {
  return typeof value === "object" ? (value as SimNode) : null;
}

export function RelationGraph({ graph }: { graph: CoAppearanceGraph }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [, forceRender] = useState(0);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const others = graph.nodes.filter((node) => !node.isCenter);
    const orderIndex = new Map(others.map((node, i) => [node.id, i]));
    const simNodes: SimNode[] = graph.nodes.map((node) => {
      if (node.isCenter) {
        return { ...node, x: centerX, y: centerY, fx: centerX, fy: centerY };
      }
      const angle =
        ((orderIndex.get(node.id) ?? 0) / Math.max(1, others.length)) *
        Math.PI *
        2;
      return {
        ...node,
        x: centerX + Math.cos(angle) * 240,
        y: centerY + Math.sin(angle) * 240,
      };
    });
    const simLinks: SimLink[] = graph.links.map((link) => ({ ...link }));
    return { nodes: simNodes, links: simLinks };
  }, [graph]);

  const maxCoCount = useMemo(
    () =>
      Math.max(
        1,
        ...graph.nodes.filter((node) => !node.isCenter).map((node) => node.count)
      ),
    [graph]
  );
  const maxWeight = useMemo(
    () => Math.max(1, ...graph.links.map((link) => link.weight)),
    [graph]
  );

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const link = (a: string, b: string) => {
      if (!map.has(a)) map.set(a, new Set());
      map.get(a)!.add(b);
    };
    for (const edge of graph.links) {
      link(edge.source, edge.target);
      link(edge.target, edge.source);
    }
    return map;
  }, [graph]);

  function radiusOf(node: SimNode): number {
    if (node.isCenter) return 30;
    return 9 + Math.sqrt(node.count / maxCoCount) * 17;
  }

  useEffect(() => {
    const simulation = forceSimulation<SimNode>(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((node) => node.id)
          .distance((edge) => 80 + 110 / (edge.weight + 1))
          .strength((edge) => Math.min(1, 0.25 + edge.weight * 0.12))
      )
      .force("charge", forceManyBody<SimNode>().strength(-420))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collide",
        forceCollide<SimNode>().radius((node) => radiusOf(node) + 20)
      );

    simulation.on("tick", () => forceRender((value) => value + 1));
    simRef.current = simulation;

    return () => {
      simulation.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, maxCoCount]);

  useEffect(() => {
    const svg = svgRef.current;
    const simulation = simRef.current;
    if (!svg || !simulation) return;

    const dragBehavior = d3drag<SVGGElement, SimNode>()
      .clickDistance(6)
      .on("start", (event: D3DragEvent<SVGGElement, SimNode, SimNode>, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        if (!d.isCenter) {
          d.fx = d.x;
          d.fy = d.y;
        }
      })
      .on("drag", (event: D3DragEvent<SVGGElement, SimNode, SimNode>, d) => {
        if (d.isCenter) return;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event: D3DragEvent<SVGGElement, SimNode, SimNode>, d) => {
        if (!event.active) simulation.alphaTarget(0);
        if (!d.isCenter) {
          d.fx = null;
          d.fy = null;
        }
      });

    select(svg)
      .selectAll<SVGGElement, SimNode>("g.relation-node")
      .data(nodes)
      .call(dragBehavior);
  }, [nodes]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 3.5])
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(event.transform);
      });

    const selection = select(svg);
    selection.call(zoomBehavior);

    return () => {
      selection.on(".zoom", null);
    };
  }, []);

  const sortedNodes = useMemo(
    () => [...graph.nodes].sort((a, b) => b.count - a.count),
    [graph]
  );

  function isNodeActive(id: string): boolean {
    if (!hoveredId) return true;
    if (id === hoveredId) return true;
    return neighbors.get(hoveredId)?.has(id) ?? false;
  }

  function isLinkActive(source: string, target: string): boolean {
    if (!hoveredId) return true;
    return source === hoveredId || target === hoveredId;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-brand-muted">
        ノードをドラッグで移動、スクロール／ピンチで拡大縮小、クリックで詳細ページへ移動できます。
      </p>

      <div className="overflow-hidden rounded-xl border border-brand-border-dark bg-brand-card-dark">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[440px] w-full touch-none sm:h-[600px]"
          role="img"
          aria-label="ドンデコルテさんの共演相関図"
        >
          <rect width={WIDTH} height={HEIGHT} fill={GRAPH_BG_COLOR} />
          <g transform={transform.toString()}>
            <g>
              {links.map((edge, index) => {
                const source = endpoint(edge.source);
                const target = endpoint(edge.target);
                if (!source || !target) return null;
                const active = isLinkActive(source.id, target.id);
                return (
                  <line
                    key={`link-${index}`}
                    x1={source.x ?? 0}
                    y1={source.y ?? 0}
                    x2={target.x ?? 0}
                    y2={target.y ?? 0}
                    stroke={active && hoveredId ? HIGHLIGHT_COLOR : LINK_COLOR}
                    strokeWidth={1 + (edge.weight / maxWeight) * 3.5}
                    strokeOpacity={active ? (hoveredId ? 0.85 : 0.45) : 0.08}
                  />
                );
              })}
            </g>
            <g>
              {nodes.map((node) => {
                const radius = radiusOf(node);
                const active = isNodeActive(node.id);
                const fill = node.isCenter
                  ? CENTER_FILL
                  : NODE_FILL[node.performer.type];
                return (
                  <g
                    key={node.id}
                    className="relation-node"
                    transform={`translate(${node.x ?? WIDTH / 2}, ${
                      node.y ?? HEIGHT / 2
                    })`}
                    style={{ cursor: "pointer" }}
                    opacity={active ? 1 : 0.2}
                    onClick={() => router.push(performerHref(node))}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <title>{`${node.performer.name}（${
                      TYPE_LABEL[node.performer.type]
                    }）共演 ${node.count} 件`}</title>
                    <circle
                      r={radius}
                      fill={fill}
                      stroke={
                        hoveredId === node.id
                          ? HOVER_STROKE_COLOR
                          : node.isCenter
                            ? HIGHLIGHT_COLOR
                            : NODE_STROKE_COLOR
                      }
                      strokeWidth={node.isCenter ? 3 : 1.5}
                    />
                    <text
                      y={radius + 13}
                      textAnchor="middle"
                      fill={node.isCenter ? CENTER_FILL : LABEL_COLOR}
                      fontSize={node.isCenter ? 14 : 11}
                      fontWeight={node.isCenter ? 700 : 500}
                    >
                      {node.performer.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
        <LegendSwatch color={CENTER_FILL} label="ドンデコルテ" />
        <LegendSwatch color={NODE_FILL.comedy_group} label="コンビ" />
        <LegendSwatch color={NODE_FILL.artist} label="芸人" />
        <LegendSwatch color={NODE_FILL.unit} label="ユニット" />
        <span>ノードの大きさ・線の太さは共演の多さを表します。</span>
      </div>

      <details className="rounded-lg border border-brand-border-dark bg-brand-card-dark">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-brand-gold">
          相関図に含まれる出演者一覧（{sortedNodes.length} 件）
        </summary>
        <ul className="border-t border-brand-border-dark">
          {sortedNodes.map((node) => (
            <li
              key={node.id}
              className="border-b border-brand-border-dark last:border-b-0"
            >
              <a
                href={performerHref(node)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition hover:bg-brand-bg-dark/40"
              >
                <span className="truncate text-brand-cream">
                  {node.performer.name}
                  <span className="ml-2 text-xs text-brand-muted">
                    {TYPE_LABEL[node.performer.type]}
                  </span>
                </span>
                <span
                  className="shrink-0 text-xs text-brand-sky-light"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  共演 {node.count}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
