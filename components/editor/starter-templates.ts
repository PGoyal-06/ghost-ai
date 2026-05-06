import { MarkerType } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function node(
  id: string,
  label: string,
  x: number,
  y: number,
  shape: NodeShape,
  colorIdx: number,
  w = 140,
  h = 70,
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color: NODE_COLORS[colorIdx].fill, shape },
    style: { width: w, height: h },
  };
}

function edge(id: string, source: string, target: string, label?: string): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { label },
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "API gateway routing to downstream services with a shared message bus and data stores.",
    nodes: [
      node("gw", "API Gateway", 300, 0, "rectangle", 1, 140, 60),
      node("auth", "Auth Service", 60, 130, "pill", 2, 130, 55),
      node("user", "User Service", 250, 130, "rectangle", 6, 130, 55),
      node("order", "Order Service", 450, 130, "rectangle", 3, 130, 55),
      node("bus", "Message Bus", 250, 260, "hexagon", 7, 130, 80),
      node("db-user", "User DB", 110, 390, "cylinder", 0, 100, 80),
      node("db-order", "Order DB", 400, 390, "cylinder", 0, 100, 80),
    ],
    edges: [
      edge("e1", "gw", "auth"),
      edge("e2", "gw", "user"),
      edge("e3", "gw", "order"),
      edge("e4", "user", "bus"),
      edge("e5", "order", "bus"),
      edge("e6", "bus", "db-user"),
      edge("e7", "bus", "db-order"),
    ],
  },
  {
    id: "cicd",
    name: "CI/CD Pipeline",
    description:
      "Automated pipeline from code commit through build, test, and security gates to production.",
    nodes: [
      node("commit", "Code Commit", 0, 80, "pill", 1, 130, 55),
      node("build", "Build", 180, 80, "rectangle", 6, 110, 55),
      node("test", "Unit Tests", 340, 0, "rectangle", 2, 110, 55),
      node("scan", "Security Scan", 340, 115, "rectangle", 4, 110, 55),
      node("stage", "Deploy Staging", 510, 80, "rectangle", 3, 130, 55),
      node("e2e", "E2E Tests", 700, 80, "rectangle", 2, 110, 55),
      node("prod", "Deploy Prod", 870, 80, "pill", 6, 130, 55),
    ],
    edges: [
      edge("e1", "commit", "build"),
      edge("e2", "build", "test"),
      edge("e3", "build", "scan"),
      edge("e4", "test", "stage"),
      edge("e5", "scan", "stage"),
      edge("e6", "stage", "e2e"),
      edge("e7", "e2e", "prod"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producers publish events to a broker; consumers process independently with a dead-letter queue.",
    nodes: [
      node("p1", "Producer A", 0, 50, "pill", 1, 120, 55),
      node("p2", "Producer B", 0, 165, "pill", 3, 120, 55),
      node("broker", "Event Broker", 220, 100, "hexagon", 7, 130, 80),
      node("c1", "Consumer A", 430, 10, "rectangle", 6, 120, 55),
      node("c2", "Consumer B", 430, 110, "rectangle", 2, 120, 55),
      node("c3", "Consumer C", 430, 210, "rectangle", 5, 120, 55),
      node("dlq", "Dead Letter Q", 630, 210, "cylinder", 4, 120, 70),
    ],
    edges: [
      edge("e1", "p1", "broker"),
      edge("e2", "p2", "broker"),
      edge("e3", "broker", "c1"),
      edge("e4", "broker", "c2"),
      edge("e5", "broker", "c3"),
      edge("e6", "c3", "dlq"),
    ],
  },
];
