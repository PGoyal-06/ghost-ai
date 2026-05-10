import type { Node, Edge } from "@xyflow/react";

/* ------------------------------------------------------------------ */
/*  Node color palette                                                 */
/* ------------------------------------------------------------------ */

export interface NodeColorPair {
  fill: string;
  text: string;
  character: string;
}

export const NODE_COLORS: NodeColorPair[] = [
  { fill: "#1F1F1F", text: "#EDEDED", character: "Neutral dark (default)" },
  { fill: "#10233D", text: "#52A8FF", character: "Blue" },
  { fill: "#2E1938", text: "#BF7AF0", character: "Purple" },
  { fill: "#331B00", text: "#FF990A", character: "Orange" },
  { fill: "#3C1618", text: "#FF6166", character: "Red" },
  { fill: "#3A1726", text: "#F75F8F", character: "Pink" },
  { fill: "#0F2E18", text: "#62C073", character: "Green" },
  { fill: "#062822", text: "#0AC7B4", character: "Teal" },
];

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];

/* ------------------------------------------------------------------ */
/*  Node shapes                                                        */
/* ------------------------------------------------------------------ */

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

/* ------------------------------------------------------------------ */
/*  Node and edge data contracts                                       */
/* ------------------------------------------------------------------ */

export interface CanvasNodeData {
  label: string;
  color: string;
  shape: NodeShape;
  [key: string]: unknown;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

export interface CanvasEdgeData {
  label?: string;
  [key: string]: unknown;
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;

export interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
