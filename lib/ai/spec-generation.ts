import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { aiChatMessageSchema } from "@/types/tasks";

const GOOGLE_MODEL_ID = "gemini-2.5-flash";
const MAX_CHAT_MESSAGES = 100;
const MAX_CONTEXT_NODES = 120;
const MAX_CONTEXT_EDGES = 180;

const canvasPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const canvasNodeDataSchema = z
  .object({
    label: z.string().trim().min(1).max(200),
    color: z.string().trim().min(1).max(40).optional(),
    shape: z.string().trim().min(1).max(40).optional(),
  })
  .passthrough();

export const specCanvasNodeSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    type: z.string().trim().min(1).max(80).optional(),
    position: canvasPositionSchema,
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    data: canvasNodeDataSchema,
  })
  .passthrough();

const canvasEdgeDataSchema = z
  .object({
    label: z.string().trim().max(200).optional(),
  })
  .passthrough();

export const specCanvasEdgeSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    source: z.string().trim().min(1).max(200),
    target: z.string().trim().min(1).max(200),
    type: z.string().trim().min(1).max(80).optional(),
    label: z.string().trim().max(200).optional(),
    data: canvasEdgeDataSchema.optional(),
  })
  .passthrough();

export const specTriggerRequestSchema = z.object({
  roomId: z.string().trim().min(1).max(200),
  chatHistory: z.array(aiChatMessageSchema).max(MAX_CHAT_MESSAGES),
  nodes: z.array(specCanvasNodeSchema).max(MAX_CONTEXT_NODES),
  edges: z.array(specCanvasEdgeSchema).max(MAX_CONTEXT_EDGES),
});

export const generateSpecPayloadSchema = specTriggerRequestSchema.extend({
  projectId: z.string().trim().min(1).max(200),
});

export type SpecTriggerRequest = z.infer<typeof specTriggerRequestSchema>;
export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;

interface SpecProjectContext {
  id: string;
  name: string;
  description: string | null;
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

async function getProjectContext(projectId: string): Promise<SpecProjectContext> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} was not found for spec generation.`);
  }

  return project;
}

function formatChatHistory(chatHistory: GenerateSpecPayload["chatHistory"]): string {
  if (chatHistory.length === 0) {
    return "No prior AI chat context was provided.";
  }

  return chatHistory
    .map(
      (message, index) =>
        `${index + 1}. [${message.role}] ${message.sender} at ${message.timestamp}: ${message.content}`
    )
    .join("\n");
}

function formatNodeList(nodes: GenerateSpecPayload["nodes"]): string {
  if (nodes.length === 0) {
    return "No canvas nodes were provided.";
  }

  return nodes
    .map((node, index) => {
      const dimensions =
        typeof node.width === "number" && typeof node.height === "number"
          ? ` size=${Math.round(node.width)}x${Math.round(node.height)}`
          : "";
      const shape = node.data.shape ? ` shape=${node.data.shape}` : "";
      const color = node.data.color ? ` color=${node.data.color}` : "";

      return `${index + 1}. id=${node.id} label="${node.data.label}" position=(${Math.round(node.position.x)}, ${Math.round(node.position.y)})${shape}${color}${dimensions}`;
    })
    .join("\n");
}

function formatEdgeList(edges: GenerateSpecPayload["edges"]): string {
  if (edges.length === 0) {
    return "No canvas edges were provided.";
  }

  return edges
    .map((edge, index) => {
      const label = edge.label ?? edge.data?.label;
      return `${index + 1}. id=${edge.id} ${edge.source} -> ${edge.target}${label ? ` label="${label}"` : ""}`;
    })
    .join("\n");
}

function buildSpecPrompt(
  project: SpecProjectContext,
  payload: GenerateSpecPayload
): string {
  return [
    `Project ID: ${project.id}`,
    `Project name: ${project.name}`,
    `Project description: ${project.description ?? "None provided."}`,
    `Room ID: ${payload.roomId}`,
    "",
    "Chat history:",
    formatChatHistory(payload.chatHistory),
    "",
    "Canvas nodes:",
    formatNodeList(payload.nodes),
    "",
    "Canvas edges:",
    formatEdgeList(payload.edges),
    "",
    "Write a Markdown technical specification for this system design.",
    "Requirements:",
    "- Output plain Markdown only. Do not wrap the response in code fences.",
    "- Base the spec on the supplied canvas graph and chat context.",
    "- Be concrete about the architecture represented in the graph.",
    "- Include these sections when the graph supports them: Overview, Architecture Summary, Components, Data Flow, Operational Considerations, Risks or Open Questions.",
    "- If the diagram or chat leaves gaps, call them out explicitly as assumptions or open questions instead of inventing hidden infrastructure.",
    "- Use concise, technical language suitable for engineering review.",
  ].join("\n");
}

export async function generateMarkdownSpec(
  rawPayload: GenerateSpecPayload
): Promise<string> {
  const payload = generateSpecPayloadSchema.parse(rawPayload);
  const project = await getProjectContext(payload.projectId);
  const google = createGoogleGenerativeAI({
    apiKey: getGoogleGenerativeAiApiKey(),
  });

  const result = await generateText({
    model: google(GOOGLE_MODEL_ID),
    system: [
      "You are Ghost AI, an expert systems architect.",
      "Convert collaborative architecture diagrams into clear engineering specifications.",
      "Favor accuracy to the provided graph over generic boilerplate.",
      "Return valid Markdown only.",
    ].join("\n"),
    prompt: buildSpecPrompt(project, payload),
  });

  const markdown = result.text.trim();

  if (!markdown) {
    throw new Error("Spec generation returned empty Markdown output.");
  }

  return markdown;
}
