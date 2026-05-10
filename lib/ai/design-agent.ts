import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLiveblocks } from "@/lib/liveblocks";
import {
  AI_STATUS_FEED_ID,
  AI_STATUS_FEED_METADATA,
  aiStatusMessageSchema,
  type AiStatusMessage,
} from "@/types/tasks";
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

const AI_AGENT_USER_ID = "ghost-ai";
const AI_AGENT_CURSOR_COLOR = "#8B82FF";
const AI_AGENT_NAME = "Ghost AI";
const GRID_SIZE = 40;
const NODE_HORIZONTAL_GAP = 80;
const NODE_VERTICAL_GAP = 56;
const MIN_NODE_WIDTH = 120;
const MAX_NODE_WIDTH = 360;
const MIN_NODE_HEIGHT = 56;
const MAX_NODE_HEIGHT = 220;
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 72;
const MAX_CONTEXT_NODES = 40;
const MAX_CONTEXT_EDGES = 60;
const GOOGLE_MODEL_ID = "gemini-2.5-flash";
const SEMANTIC_NODE_COLORS = {
  neutral: NODE_COLORS[0].fill,
  blue: NODE_COLORS[1].fill,
  purple: NODE_COLORS[2].fill,
  orange: NODE_COLORS[3].fill,
  red: NODE_COLORS[4].fill,
  pink: NODE_COLORS[5].fill,
  green: NODE_COLORS[6].fill,
  teal: NODE_COLORS[7].fill,
} as const;

const nodeShapeSchema = z.enum(NODE_SHAPES);
const nodeColorSchema = z.enum(
  NODE_COLORS.map((color) => color.fill) as [string, ...string[]]
);

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const sizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

const modelPositionSchema = z.union([
  positionSchema,
  z.tuple([z.number(), z.number()]),
]);

const modelSizeSchema = z.union([
  sizeSchema,
  z.object({
    width: z.number(),
    height: z.number(),
  }),
]);

const designActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("add_node"),
    ref: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    shape: nodeShapeSchema.optional(),
    color: nodeColorSchema.optional(),
    position: positionSchema.optional(),
    size: sizeSchema.optional(),
  }),
  z.object({
    type: z.literal("move_node"),
    node: z.string().trim().min(1).max(200),
    position: positionSchema,
  }),
  z.object({
    type: z.literal("resize_node"),
    node: z.string().trim().min(1).max(200),
    size: sizeSchema,
  }),
  z.object({
    type: z.literal("update_node_data"),
    node: z.string().trim().min(1).max(200),
    label: z.string().trim().min(1).max(120).optional(),
    shape: nodeShapeSchema.optional(),
    color: nodeColorSchema.optional(),
  }),
  z.object({
    type: z.literal("delete_node"),
    node: z.string().trim().min(1).max(200),
  }),
  z.object({
    type: z.literal("add_edge"),
    source: z.string().trim().min(1).max(200),
    target: z.string().trim().min(1).max(200),
    label: z.string().trim().max(120).optional(),
  }),
  z.object({
    type: z.literal("delete_edge"),
    edge: z.string().trim().min(1).max(200),
  }),
]);

const designPlanSchema = z.object({
  summary: z.string().trim().min(1).max(240),
  actions: z.array(designActionSchema).max(64),
});

const modelAddNodeActionSchema = z
  .object({
    type: z.literal("add_node"),
    ref: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120).optional(),
    data: z.unknown().optional(),
    shape: z.string().trim().min(1).max(40).optional(),
    nodeType: z.string().trim().min(1).max(40).optional(),
    color: z.string().trim().min(1).max(40).optional(),
    position: modelPositionSchema.optional(),
    size: modelSizeSchema.optional(),
  })
  .refine((action) => Boolean(action.label ?? action.data), {
    message: "add_node requires a label or data field.",
    path: ["label"],
  });

const modelUpdateNodeDataActionSchema = z
  .object({
    type: z.literal("update_node_data"),
    node: z.string().trim().min(1).max(200),
    label: z.string().trim().min(1).max(120).optional(),
    data: z.unknown().optional(),
    shape: z.string().trim().min(1).max(40).optional(),
    nodeType: z.string().trim().min(1).max(40).optional(),
    color: z.string().trim().min(1).max(40).optional(),
  })
  .refine(
    (action) =>
      Boolean(
        action.label ??
          action.data ??
          action.shape ??
          action.nodeType ??
          action.color
      ),
    {
      message:
        "update_node_data requires at least one of label, data, shape, nodeType, or color.",
    }
  );

const modelResizeNodeActionSchema = z
  .object({
    type: z.literal("resize_node"),
    node: z.string().trim().min(1).max(200),
    size: modelSizeSchema.optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .refine(
    (action) =>
      Boolean(
        action.size ||
          (typeof action.width === "number" &&
            typeof action.height === "number")
      ),
    {
      message: "resize_node requires size or both width and height.",
    }
  );

const modelAddEdgeActionSchema = z.object({
  type: z.literal("add_edge"),
  source: z.string().trim().min(1).max(200),
  target: z.string().trim().min(1).max(200),
  label: z.string().trim().max(120).optional(),
  data: z.unknown().optional(),
});

const modelDesignActionSchema = z.discriminatedUnion("type", [
  modelAddNodeActionSchema,
  z.object({
    type: z.literal("move_node"),
    node: z.string().trim().min(1).max(200),
    position: modelPositionSchema,
  }),
  modelResizeNodeActionSchema,
  modelUpdateNodeDataActionSchema,
  z.object({
    type: z.literal("delete_node"),
    node: z.string().trim().min(1).max(200),
  }),
  modelAddEdgeActionSchema,
  z.object({
    type: z.literal("delete_edge"),
    edge: z.string().trim().min(1).max(200),
  }),
]);

const modelDesignPlanSchema = z.object({
  summary: z.string().trim().min(1).max(240),
  actions: z.array(modelDesignActionSchema).max(64),
});

type DesignAction = z.infer<typeof designActionSchema>;
type DesignPlan = z.infer<typeof designPlanSchema>;
type ModelDesignAction = z.infer<typeof modelDesignActionSchema>;

export interface DesignCanvasSnapshot {
  project: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface ApplyDesignPlanResult {
  appliedActionCount: number;
  skippedActionCount: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getGoogleGenerativeAiApiKey(): string {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Google Generative AI API key is missing. Set GOOGLE_AI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY."
    );
  }

  return apiKey;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeSemanticText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function getNodeSize(node: CanvasNode): { width: number; height: number } {
  const width =
    typeof node.style?.width === "number"
      ? node.style.width
      : DEFAULT_NODE_WIDTH;
  const height =
    typeof node.style?.height === "number"
      ? node.style.height
      : DEFAULT_NODE_HEIGHT;

  return {
    width,
    height,
  };
}

function toBounds(node: CanvasNode): NodeBounds {
  const size = getNodeSize(node);

  return {
    x: node.position.x,
    y: node.position.y,
    width: size.width,
    height: size.height,
  };
}

function boxesOverlap(a: NodeBounds, b: NodeBounds): boolean {
  return (
    a.x < b.x + b.width + NODE_HORIZONTAL_GAP &&
    a.x + a.width + NODE_HORIZONTAL_GAP > b.x &&
    a.y < b.y + b.height + NODE_VERTICAL_GAP &&
    a.y + a.height + NODE_VERTICAL_GAP > b.y
  );
}

function resolveFreePosition(
  existingNodes: CanvasNode[],
  proposedPosition: { x: number; y: number },
  size: { width: number; height: number }
): { x: number; y: number } {
  let candidate = {
    x: snapToGrid(proposedPosition.x),
    y: snapToGrid(proposedPosition.y),
  };

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidateBounds: NodeBounds = {
      x: candidate.x,
      y: candidate.y,
      width: size.width,
      height: size.height,
    };

    const collides = existingNodes.some((node) =>
      boxesOverlap(candidateBounds, toBounds(node))
    );

    if (!collides) {
      return candidate;
    }

    candidate = {
      x: snapToGrid(candidate.x + DEFAULT_NODE_WIDTH + NODE_HORIZONTAL_GAP),
      y:
        attempt % 3 === 2
          ? snapToGrid(candidate.y + DEFAULT_NODE_HEIGHT + NODE_VERTICAL_GAP)
          : candidate.y,
    };
  }

  return candidate;
}

function sanitizeNodeShape(shape: NodeShape | undefined): NodeShape {
  return shape && NODE_SHAPES.includes(shape) ? shape : "rectangle";
}

function sanitizeNodeColor(color: string | undefined): string {
  return NODE_COLORS.some((option) => option.fill === color)
    ? color!
    : DEFAULT_NODE_COLOR.fill;
}

function normalizePositionInput(
  value: z.infer<typeof modelPositionSchema> | undefined
): { x: number; y: number } | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return {
      x: value[0],
      y: value[1],
    };
  }

  return value;
}

function normalizeSizeInput(
  value:
    | z.infer<typeof modelSizeSchema>
    | { width?: number; height?: number }
    | undefined
): { width: number; height: number } | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value.width === "number" && typeof value.height === "number") {
    return {
      width: value.width,
      height: value.height,
    };
  }

  return undefined;
}

function includesSemanticKeyword(
  text: string,
  keywords: readonly string[]
): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function inferNodeShapeFromSemantics(
  label: string,
  nodeType?: string
): NodeShape {
  const semanticText = normalizeSemanticText(`${label} ${nodeType ?? ""}`);

  if (
    includesSemanticKeyword(semanticText, [
      "user",
      "client",
      "browser",
      "customer",
      "admin",
      "operator",
      "frontend",
      "mobile",
      "web app",
      "web client",
    ])
  ) {
    return "circle";
  }

  if (
    includesSemanticKeyword(semanticText, [
      "database",
      "db",
      "postgres",
      "mysql",
      "sql",
      "nosql",
      "mongo",
      "redis",
      "cache",
      "storage",
      "bucket",
      "blob",
      "object store",
      "warehouse",
      "index",
    ])
  ) {
    return "cylinder";
  }

  if (
    includesSemanticKeyword(semanticText, [
      "external",
      "third party",
      "provider",
      "partner",
      "vendor",
      "webhook",
    ])
  ) {
    return "hexagon";
  }

  if (
    includesSemanticKeyword(semanticText, [
      "decision",
      "router",
      "branch",
      "switch",
      "gateway decision",
    ])
  ) {
    return "diamond";
  }

  return "rectangle";
}

function inferNodeColorFromSemantics(
  label: string,
  shape: NodeShape,
  nodeType?: string
): string {
  const semanticText = normalizeSemanticText(`${label} ${nodeType ?? ""}`);

  if (shape === "circle") {
    return SEMANTIC_NODE_COLORS.pink;
  }

  if (shape === "hexagon") {
    return SEMANTIC_NODE_COLORS.teal;
  }

  if (
    includesSemanticKeyword(semanticText, [
      "auth",
      "identity",
      "oauth",
      "login",
      "session",
      "token",
      "user service",
    ])
  ) {
    return SEMANTIC_NODE_COLORS.purple;
  }

  if (
    includesSemanticKeyword(semanticText, [
      "queue",
      "kafka",
      "rabbitmq",
      "pubsub",
      "stream",
      "broker",
      "topic",
      "event bus",
      "order processing",
      "worker",
      "processor",
    ])
  ) {
    return SEMANTIC_NODE_COLORS.orange;
  }

  if (shape === "cylinder") {
    return includesSemanticKeyword(semanticText, ["cache", "redis"])
      ? SEMANTIC_NODE_COLORS.green
      : SEMANTIC_NODE_COLORS.teal;
  }

  if (
    includesSemanticKeyword(semanticText, [
      "error",
      "failure",
      "dead letter",
    ])
  ) {
    return SEMANTIC_NODE_COLORS.red;
  }

  return SEMANTIC_NODE_COLORS.blue;
}

function resolveAddNodePresentation(
  label: string,
  shape: NodeShape | undefined,
  color: string | undefined,
  nodeType?: string
): { shape: NodeShape; color: string } {
  const resolvedShape = sanitizeNodeShape(
    shape ?? mapModelNodeTypeToShape(nodeType) ?? inferNodeShapeFromSemantics(label, nodeType)
  );

  return {
    shape: resolvedShape,
    color: NODE_COLORS.some((option) => option.fill === color)
      ? color!
      : inferNodeColorFromSemantics(label, resolvedShape, nodeType),
  };
}

function isRelationshipLabel(label: string): boolean {
  const semanticText = normalizeSemanticText(label);

  if (!semanticText || semanticText.split(" ").length > 3) {
    return false;
  }

  return (
    includesSemanticKeyword(semanticText, [
      "authenticate",
      "authorize",
      "verify",
      "validate",
      "request",
      "response",
      "read",
      "write",
      "update",
      "sync",
      "publish",
      "subscribe",
      "broadcast",
      "notify",
      "process",
      "place order",
      "update stock",
      "cache miss",
      "cache hit",
      "user data",
      "real time",
      "realtime",
      "messaging",
      "broadcasts",
      "rest api",
      "graphql",
      "websocket",
    ]) ||
    /.+ (data|event|message|command|request|response)$/.test(semanticText)
  );
}

function referencesPlannedNode(reference: string, action: DesignAction): boolean {
  const trimmedReference = reference.trim();

  if ("ref" in action && action.type === "add_node") {
    return (
      action.ref === trimmedReference ||
      normalizeLabel(action.label) === normalizeLabel(trimmedReference)
    );
  }

  return false;
}

function collapseRelationshipLabelNodes(
  actions: DesignAction[]
): DesignAction[] {
  const indicesToRemove = new Set<number>();
  const synthesizedEdges: DesignAction[] = [];

  actions.forEach((action, index) => {
    if (
      action.type !== "add_node" ||
      action.shape !== "pill" ||
      !isRelationshipLabel(action.label)
    ) {
      return;
    }

    const touchesNodeOutsideEdges = actions.some((candidate, candidateIndex) => {
      if (candidateIndex === index) {
        return false;
      }

      if (
        candidate.type === "move_node" ||
        candidate.type === "resize_node" ||
        candidate.type === "update_node_data" ||
        candidate.type === "delete_node"
      ) {
        return referencesPlannedNode(candidate.node, action);
      }

      return false;
    });

    if (touchesNodeOutsideEdges) {
      return;
    }

    const incoming: Array<DesignAction & { type: "add_edge" }> = [];
    const outgoing: Array<DesignAction & { type: "add_edge" }> = [];

    actions.forEach((candidate, candidateIndex) => {
      if (candidate.type !== "add_edge") {
        return;
      }

      if (referencesPlannedNode(candidate.target, action)) {
        incoming.push(candidate);
        indicesToRemove.add(candidateIndex);
      }

      if (referencesPlannedNode(candidate.source, action)) {
        outgoing.push(candidate);
        indicesToRemove.add(candidateIndex);
      }
    });

    if (incoming.length === 0 || outgoing.length === 0) {
      incoming.length = 0;
      outgoing.length = 0;
      [...indicesToRemove].forEach((candidateIndex) => {
        const candidate = actions[candidateIndex];
        if (
          candidate?.type === "add_edge" &&
          (referencesPlannedNode(candidate.target, action) ||
            referencesPlannedNode(candidate.source, action))
        ) {
          indicesToRemove.delete(candidateIndex);
        }
      });
      return;
    }

    indicesToRemove.add(index);

    for (const sourceEdge of incoming) {
      for (const targetEdge of outgoing) {
        if (sourceEdge.source === targetEdge.target) {
          continue;
        }

        synthesizedEdges.push({
          type: "add_edge",
          source: sourceEdge.source,
          target: targetEdge.target,
          label: action.label,
        });
      }
    }
  });

  return [
    ...actions.filter((_, index) => !indicesToRemove.has(index)),
    ...synthesizedEdges,
  ];
}

function normalizeRawActionOutput(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const normalized: Record<string, unknown> = { ...value };

  if (
    typeof normalized.action === "string" &&
    typeof normalized.type !== "string"
  ) {
    normalized.type = normalized.action;
  }

  if (Array.isArray(normalized.position) && normalized.position.length >= 2) {
    normalized.position = {
      x: normalized.position[0],
      y: normalized.position[1],
    };
  }

  if (Array.isArray(normalized.size) && normalized.size.length >= 2) {
    normalized.size = {
      width: normalized.size[0],
      height: normalized.size[1],
    };
  }

  if (isRecord(normalized.data)) {
    if (
      typeof normalized.data.label === "string" &&
      typeof normalized.label !== "string"
    ) {
      normalized.label = normalized.data.label;
    }

    if (
      typeof normalized.data.shape === "string" &&
      typeof normalized.shape !== "string"
    ) {
      normalized.shape = normalized.data.shape;
    }

    if (
      typeof normalized.data.color === "string" &&
      typeof normalized.color !== "string"
    ) {
      normalized.color = normalized.data.color;
    }

    if (
      typeof normalized.data.type === "string" &&
      typeof normalized.nodeType !== "string" &&
      typeof normalized.shape !== "string"
    ) {
      normalized.nodeType = normalized.data.type;
    }

    delete normalized.data;
  }

  if (
    typeof normalized.data === "string" &&
    typeof normalized.label !== "string"
  ) {
    if (
      normalized.type === "add_node" ||
      normalized.type === "update_node_data"
    ) {
      normalized.label = normalized.data;
    }

    if (normalized.type === "add_edge") {
      normalized.label = normalized.data;
    }
  }

  return normalized;
}

function normalizeRawPlanOutput(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      summary: "Generated design plan.",
      actions: value.map(normalizeRawActionOutput),
    };
  }

  if (!isRecord(value)) {
    return value;
  }

  const normalized: Record<string, unknown> = { ...value };

  if (Array.isArray(normalized.actions)) {
    normalized.actions = normalized.actions.map(normalizeRawActionOutput);
  } else if (Array.isArray(normalized.plan)) {
    normalized.actions = normalized.plan.map(normalizeRawActionOutput);
  }

  if (typeof normalized.summary !== "string") {
    normalized.summary = "Generated design plan.";
  }

  return normalized;
}

function getActionTextValue(
  value: unknown,
  fallback: string | undefined
): string | undefined {
  if (typeof fallback === "string") {
    return fallback;
  }

  return typeof value === "string" ? value : undefined;
}

function mapModelNodeTypeToShape(
  value: string | undefined
): NodeShape | undefined {
  if (!value) {
    return undefined;
  }

  switch (normalizeLabel(value)) {
    case "data":
    case "database":
    case "storage":
      return "cylinder";
    case "external":
    case "external-system":
    case "boundary":
    case "input":
    case "output":
      return "hexagon";
    case "event":
      return "circle";
    case "service":
    case "process":
      return "rectangle";
    case "messagequeue":
    case "message-queue":
    case "queue":
    case "pubsub":
    case "stream":
    case "broker":
      return "rectangle";
    default:
      return undefined;
  }
}

function normalizeModelAction(action: ModelDesignAction): DesignAction {
  switch (action.type) {
    case "add_node": {
      const label = getActionTextValue(action.data, action.label) ?? action.ref;
      const presentation = resolveAddNodePresentation(
        label,
        action.shape as NodeShape | undefined,
        action.color,
        action.nodeType
      );

      return {
        type: "add_node",
        ref: action.ref,
        label,
        shape: presentation.shape,
        color: presentation.color,
        position: normalizePositionInput(action.position),
        size: normalizeSizeInput(action.size),
      };
    }
    case "move_node":
      return {
        type: "move_node",
        node: action.node,
        position: normalizePositionInput(action.position)!,
      };
    case "resize_node":
      return {
        type: "resize_node",
        node: action.node,
        size:
          normalizeSizeInput(action.size ?? action) ?? {
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
          },
      };
    case "update_node_data": {
      const shape =
        (action.shape as NodeShape | undefined) ??
        mapModelNodeTypeToShape(action.nodeType);

      return {
        type: "update_node_data",
        node: action.node,
        label: getActionTextValue(action.data, action.label),
        shape: shape ? sanitizeNodeShape(shape) : undefined,
        color: action.color ? sanitizeNodeColor(action.color) : undefined,
      };
    }
    case "delete_node":
      return action;
    case "add_edge":
      return {
        type: "add_edge",
        source: action.source,
        target: action.target,
        label: getActionTextValue(action.data, action.label),
      };
    case "delete_edge":
      return action;
  }
}

function sanitizeNodeSize(
  requestedSize: { width: number; height: number } | undefined,
  shape: NodeShape,
  label?: string
): { width: number; height: number } {
  if (!requestedSize) {
    const normalizedLabel = label?.trim() ?? "";
    const longestWord = normalizedLabel
      .split(/\s+/)
      .reduce((max, word) => Math.max(max, word.length), 0);
    const widthFromText = Math.max(
      DEFAULT_NODE_WIDTH,
      normalizedLabel.length * 7 + 80,
      longestWord * 14 + 56
    );
    const multiLineHeight =
      normalizedLabel.length > 18 || normalizedLabel.includes(" ")
        ? DEFAULT_NODE_HEIGHT + 16
        : DEFAULT_NODE_HEIGHT;

    if (shape === "circle") {
      const side = clamp(
        Math.max(148, longestWord * 14 + 64, normalizedLabel.length * 6 + 100),
        MIN_NODE_WIDTH,
        220
      );
      return {
        width: side,
        height: side,
      };
    }

    if (shape === "diamond") {
      const side = clamp(Math.max(150, widthFromText - 16), 150, 220);
      return {
        width: side,
        height: side,
      };
    }

    if (shape === "cylinder") {
      return {
        width: clamp(widthFromText, 180, 280),
        height: clamp(Math.max(104, multiLineHeight + 20), 96, 140),
      };
    }

    if (shape === "hexagon") {
      return {
        width: clamp(widthFromText + 12, 180, 280),
        height: clamp(Math.max(84, multiLineHeight + 8), 80, 120),
      };
    }

    return {
      width: clamp(widthFromText, MIN_NODE_WIDTH, MAX_NODE_WIDTH),
      height: clamp(multiLineHeight, MIN_NODE_HEIGHT, 108),
    };
  }

  const width = clamp(
    requestedSize?.width ?? DEFAULT_NODE_WIDTH,
    MIN_NODE_WIDTH,
    MAX_NODE_WIDTH
  );
  const height = clamp(
    requestedSize?.height ?? DEFAULT_NODE_HEIGHT,
    MIN_NODE_HEIGHT,
    MAX_NODE_HEIGHT
  );

  if (shape === "circle") {
    const side = Math.max(width, height);
    return { width: side, height: side };
  }

  return {
    width,
    height,
  };
}

function createNodeId(ref: string, usedIds: Set<string>): string {
  const base = `ai-${slugify(ref) || "node"}`;
  let candidate = base;
  let index = 1;

  while (usedIds.has(candidate)) {
    candidate = `${base}-${index++}`;
  }

  usedIds.add(candidate);
  return candidate;
}

function createEdgeId(
  sourceId: string,
  targetId: string,
  usedIds: Set<string>
): string {
  const base = `ai-edge-${slugify(sourceId)}-${slugify(targetId)}`;
  let candidate = base;
  let index = 1;

  while (usedIds.has(candidate)) {
    candidate = `${base}-${index++}`;
  }

  usedIds.add(candidate);
  return candidate;
}

function serializeSnapshot(snapshot: DesignCanvasSnapshot): string {
  const projectSummary = snapshot.project
    ? `Project: ${snapshot.project.name}${
        snapshot.project.description
          ? `\nProject description: ${snapshot.project.description}`
          : ""
      }`
    : "Project: unavailable";

  const nodes =
    snapshot.nodes.length === 0
      ? "Current nodes: none"
      : `Current nodes:\n${snapshot.nodes
          .slice(0, MAX_CONTEXT_NODES)
          .map((node) => {
            const size = getNodeSize(node);
            return `- id=${node.id}; label="${node.data.label}"; shape=${node.data.shape}; color=${node.data.color}; x=${node.position.x}; y=${node.position.y}; width=${size.width}; height=${size.height}`;
          })
          .join("\n")}`;

  const nodeLabels = new Map(
    snapshot.nodes.map((node) => [node.id, node.data.label || node.id])
  );

  const edges =
    snapshot.edges.length === 0
      ? "Current edges: none"
      : `Current edges:\n${snapshot.edges
          .slice(0, MAX_CONTEXT_EDGES)
          .map((edge) => {
            const sourceLabel = nodeLabels.get(edge.source) ?? edge.source;
            const targetLabel = nodeLabels.get(edge.target) ?? edge.target;
            return `- id=${edge.id}; source=${edge.source}("${sourceLabel}"); target=${edge.target}("${targetLabel}")${
              edge.data?.label ? `; label="${edge.data.label}"` : ""
            }`;
          })
          .join("\n")}`;

  return `${projectSummary}\n\n${nodes}\n\n${edges}`;
}

function buildPlanningPrompt(
  prompt: string,
  snapshot: DesignCanvasSnapshot
): string {
  return [
    "User request:",
    prompt,
    "",
    serializeSnapshot(snapshot),
    "",
    "Planning requirements:",
    '- Use only these action types: "add_node", "move_node", "resize_node", "update_node_data", "delete_node", "add_edge", "delete_edge".',
    "- Use only allowed node shapes and palette colors.",
    "- Use shape semantics consistently: actors and end users as circles, services and gateways as rectangles, data stores and caches as cylinders, external systems as hexagons, decisions as diamonds.",
    "- Use color semantics consistently: user-facing actors pink, gateways/services blue, auth/identity purple, queues/async processors orange, caches/datastores green or teal.",
    "- Put interaction words on edges, not in standalone nodes. Labels like REST API, Authenticate, User Data, Real-time, Broadcasts, Cache Miss, Process Order, and Write/Update belong on edges.",
    '- When adding edges for a new architecture, include concise labels for the important request, data, and async flows.',
    "- Place nodes on a 40px grid and keep clear spacing between nodes.",
    "- Reuse and update existing nodes when they already match the intent instead of duplicating them.",
    '- For "add_node", always provide a stable "ref" so later actions can refer to new nodes.',
    '- For node references in other actions, use an existing node ID, an "add_node" ref from this same plan, or an exact node label from the current canvas.',
    "- For edge deletions, use the existing edge ID from the current canvas.",
    "- Keep the plan minimal and precise. Only include actions that should actually change the canvas.",
  ].join("\n");
}

function getNodeByReference(
  nodes: CanvasNode[],
  refToNodeId: Map<string, string>,
  reference: string
): CanvasNode | undefined {
  const trimmedReference = reference.trim();
  const refNodeId = refToNodeId.get(trimmedReference);

  if (refNodeId) {
    return nodes.find((node) => node.id === refNodeId);
  }

  const byId = nodes.find((node) => node.id === trimmedReference);
  if (byId) {
    return byId;
  }

  const normalizedReference = normalizeLabel(trimmedReference);
  return nodes.find(
    (node) => normalizeLabel(node.data.label ?? "") === normalizedReference
  );
}

function getEdgeByReference(edges: CanvasEdge[], reference: string) {
  const trimmedReference = reference.trim();
  const byId = edges.find((edge) => edge.id === trimmedReference);

  if (byId) {
    return byId;
  }

  const normalizedReference = normalizeLabel(trimmedReference);

  return edges.find(
    (edge) => normalizeLabel(edge.data?.label ?? "") === normalizedReference
  );
}

function getSuggestedPresenceCursor(
  snapshot: DesignCanvasSnapshot,
  actions: DesignAction[]
): { x: number; y: number } | null {
  const firstAction = actions[0];
  if (!firstAction) {
    return snapshot.nodes[0]?.position ?? null;
  }

  if (firstAction.type === "add_node" && firstAction.position) {
    return {
      x: snapToGrid(firstAction.position.x),
      y: snapToGrid(firstAction.position.y),
    };
  }

  if (
    firstAction.type === "move_node" ||
    firstAction.type === "resize_node" ||
    firstAction.type === "update_node_data" ||
    firstAction.type === "delete_node"
  ) {
    return getNodeByReference(snapshot.nodes, new Map(), firstAction.node)
      ?.position ?? null;
  }

  if (firstAction.type === "add_edge") {
    return getNodeByReference(snapshot.nodes, new Map(), firstAction.source)
      ?.position ?? null;
  }

  return snapshot.nodes[0]?.position ?? null;
}

async function ensureStatusFeed(roomId: string) {
  const liveblocks = getLiveblocks();
  const { data: feeds } = await liveblocks.getFeeds({ roomId });
  const statusFeedExists = feeds.some(
    (feed) => feed.feedId === AI_STATUS_FEED_ID
  );

  if (!statusFeedExists) {
    await liveblocks.createFeed({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      metadata: AI_STATUS_FEED_METADATA,
    });
  }
}

export async function publishDesignStatus(
  roomId: string,
  status: AiStatusMessage["status"],
  text?: string
) {
  const liveblocks = getLiveblocks();
  const message = aiStatusMessageSchema.parse({
    kind: "design",
    status,
    text,
    timestamp: new Date().toISOString(),
  });

  await liveblocks.createFeedMessage({
    roomId,
    feedId: AI_STATUS_FEED_ID,
    data: message,
  });
}

export async function setDesignAgentPresence(
  roomId: string,
  presence: { cursor: { x: number; y: number } | null; thinking: boolean }
) {
  const liveblocks = getLiveblocks();

  await liveblocks.setPresence(roomId, {
    userId: AI_AGENT_USER_ID,
    userInfo: {
      name: AI_AGENT_NAME,
      avatar: "",
      cursorColor: AI_AGENT_CURSOR_COLOR,
    },
    data: presence,
    ttl: 120,
  });
}

export async function clearDesignAgentPresence(roomId: string) {
  await setDesignAgentPresence(roomId, {
    cursor: null,
    thinking: false,
  });
}

export async function getDesignCanvasSnapshot(
  roomId: string
): Promise<DesignCanvasSnapshot> {
  const liveblocks = getLiveblocks();
  await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] });

  const [storage, project] = await Promise.all([
    liveblocks.getStorageDocument(roomId, "json") as Promise<{
      flow?: {
        nodes?: Record<string, CanvasNode>;
        edges?: Record<string, CanvasEdge>;
      };
    }>,
    prisma.project.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    }),
  ]);

  return {
    project,
    nodes: Object.values(storage.flow?.nodes ?? {}),
    edges: Object.values(storage.flow?.edges ?? {}),
  };
}

export async function planDesignActions(
  prompt: string,
  snapshot: DesignCanvasSnapshot
): Promise<DesignPlan> {
  const google = createGoogleGenerativeAI({
    apiKey: getGoogleGenerativeAiApiKey(),
  });

  try {
    const result = await generateText({
      model: google(GOOGLE_MODEL_ID),
      system: [
        "You are Ghost AI, a collaborative system design planner.",
        "Translate the user request into concrete canvas actions for a React Flow architecture diagram.",
        "Respect the current canvas state. Update matching nodes instead of duplicating them when possible.",
        "Return only a structured design plan that matches the provided schema.",
        "Prefer simple left-to-right layouts for architectures unless the existing canvas implies a different structure.",
        "Keep node spacing clear and use concise technical labels.",
      ].join("\n"),
      prompt: buildPlanningPrompt(prompt, snapshot),
      output: Output.json({
        name: "design_plan",
        description:
          "Structured canvas action plan to apply to a collaborative React Flow architecture diagram.",
      }),
    });

    const normalizedOutput = normalizeRawPlanOutput(result.output);
    const parsedPlan = modelDesignPlanSchema.safeParse(normalizedOutput);

    if (!parsedPlan.success) {
      const modelOutput = JSON.stringify(normalizedOutput).slice(0, 400);

      throw new Error(
        `Design planner produced invalid JSON structure. ${parsedPlan.error.message}. Model output: ${modelOutput}`
      );
    }

    return designPlanSchema.parse({
      summary: parsedPlan.data.summary,
      actions: collapseRelationshipLabelNodes(
        parsedPlan.data.actions.map(normalizeModelAction)
      ),
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const causeMessage =
        error.cause instanceof Error ? error.cause.message : "Unknown cause.";
      const modelText = error.text?.trim();
      const details = modelText
        ? ` Model output: ${modelText.slice(0, 400)}`
        : "";

      throw new Error(
        `Design planner produced invalid structured output. finishReason=${error.finishReason}. ${causeMessage}${details}`,
        { cause: error }
      );
    }

    throw error;
  }
}

export async function applyDesignPlan(
  roomId: string,
  actions: DesignAction[]
): Promise<ApplyDesignPlanResult> {
  const liveblocks = getLiveblocks();
  let appliedActionCount = 0;
  let skippedActionCount = 0;
  let finalNodes: CanvasNode[] = [];
  let finalEdges: CanvasEdge[] = [];

  await mutateFlow<CanvasNode, CanvasEdge>(
    {
      client: liveblocks,
      roomId,
    },
    async (flow) => {
      const refToNodeId = new Map<string, string>();
      const usedNodeIds = new Set(flow.nodes.map((node) => node.id));
      const usedEdgeIds = new Set(flow.edges.map((edge) => edge.id));

      for (const action of actions) {
        switch (action.type) {
          case "add_node": {
            const shape = sanitizeNodeShape(action.shape);
            const color = sanitizeNodeColor(action.color);
            const size = sanitizeNodeSize(action.size, shape, action.label);
            const position = resolveFreePosition(
              [...flow.nodes],
              action.position ?? {
                x: 0,
                y: flow.nodes.length * (DEFAULT_NODE_HEIGHT + NODE_VERTICAL_GAP),
              },
              size
            );

            const nodeId = createNodeId(action.ref, usedNodeIds);
            refToNodeId.set(action.ref, nodeId);

            const node: CanvasNode = {
              id: nodeId,
              type: "canvasNode",
              position,
              data: {
                label: action.label.trim(),
                color,
                shape,
              },
              style: {
                width: size.width,
                height: size.height,
              },
            };

            flow.addNode(node);
            appliedActionCount++;
            break;
          }

          case "move_node": {
            const targetNode = getNodeByReference(
              [...flow.nodes],
              refToNodeId,
              action.node
            );

            if (!targetNode) {
              skippedActionCount++;
              break;
            }

            const targetSize = getNodeSize(targetNode);
            const position = resolveFreePosition(
              [...flow.nodes].filter((node) => node.id !== targetNode.id),
              action.position,
              targetSize
            );

            flow.updateNode(targetNode.id, {
              position,
            });
            appliedActionCount++;
            break;
          }

          case "resize_node": {
            const targetNode = getNodeByReference(
              [...flow.nodes],
              refToNodeId,
              action.node
            );

            if (!targetNode) {
              skippedActionCount++;
              break;
            }

            const shape = sanitizeNodeShape(targetNode.data.shape);
            const size = sanitizeNodeSize(action.size, shape);

            flow.updateNode(targetNode.id, {
              style: {
                ...targetNode.style,
                width: size.width,
                height: size.height,
              },
            });
            appliedActionCount++;
            break;
          }

          case "update_node_data": {
            const targetNode = getNodeByReference(
              [...flow.nodes],
              refToNodeId,
              action.node
            );

            if (!targetNode) {
              skippedActionCount++;
              break;
            }

            flow.updateNodeData(targetNode.id, {
              ...(action.label ? { label: action.label.trim() } : {}),
              ...(action.color
                ? { color: sanitizeNodeColor(action.color) }
                : {}),
              ...(action.shape
                ? { shape: sanitizeNodeShape(action.shape) }
                : {}),
            });
            appliedActionCount++;
            break;
          }

          case "delete_node": {
            const targetNode = getNodeByReference(
              [...flow.nodes],
              refToNodeId,
              action.node
            );

            if (!targetNode) {
              skippedActionCount++;
              break;
            }

            const connectedEdgeIds = flow.edges
              .filter(
                (edge) =>
                  edge.source === targetNode.id || edge.target === targetNode.id
              )
              .map((edge) => edge.id);

            if (connectedEdgeIds.length > 0) {
              flow.removeEdges(connectedEdgeIds);
            }
            flow.removeNode(targetNode.id);
            appliedActionCount++;
            break;
          }

          case "add_edge": {
            const sourceNode = getNodeByReference(
              [...flow.nodes],
              refToNodeId,
              action.source
            );
            const targetNode = getNodeByReference(
              [...flow.nodes],
              refToNodeId,
              action.target
            );

            if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) {
              skippedActionCount++;
              break;
            }

            const duplicateEdge = flow.edges.find(
              (edge) =>
                edge.source === sourceNode.id &&
                edge.target === targetNode.id &&
                (edge.data?.label ?? "") === (action.label?.trim() ?? "")
            );

            if (duplicateEdge) {
              skippedActionCount++;
              break;
            }

            const edge: CanvasEdge = {
              id: createEdgeId(sourceNode.id, targetNode.id, usedEdgeIds),
              type: "canvasEdge",
              source: sourceNode.id,
              target: targetNode.id,
              data: action.label?.trim()
                ? { label: action.label.trim() }
                : undefined,
            };

            flow.addEdge(edge);
            appliedActionCount++;
            break;
          }

          case "delete_edge": {
            const targetEdge = getEdgeByReference([...flow.edges], action.edge);

            if (!targetEdge) {
              skippedActionCount++;
              break;
            }

            flow.removeEdge(targetEdge.id);
            appliedActionCount++;
            break;
          }
        }
      }

      finalNodes = [...flow.nodes];
      finalEdges = [...flow.edges];
    }
  );

  return {
    appliedActionCount,
    skippedActionCount,
    nodes: finalNodes,
    edges: finalEdges,
  };
}

export async function prepareDesignAgentRoom(roomId: string) {
  const liveblocks = getLiveblocks();
  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });
  await ensureStatusFeed(roomId);
}

export function getDesignPlanFocus(
  snapshot: DesignCanvasSnapshot,
  actions: DesignAction[]
) {
  return getSuggestedPresenceCursor(snapshot, actions);
}
