import { z } from "zod";

export const AI_STATUS_FEED_ID = "ai-status-feed";
export const AI_CHAT_FEED_ID = "ai-chat";

export const AI_STATUS_FEED_METADATA = {
  scope: "room",
  purpose: "shared-ai-status",
} as const;

export const AI_CHAT_FEED_METADATA = {
  scope: "room",
  purpose: "shared-ai-chat",
} as const;

export const aiTaskKindSchema = z.enum(["design", "spec"]);

export const aiTaskStatusSchema = z.enum([
  "start",
  "processing",
  "complete",
  "error",
]);

export const aiStatusMessageSchema = z.object({
  kind: aiTaskKindSchema,
  status: aiTaskStatusSchema,
  text: z.string().trim().min(1).max(280).optional(),
  timestamp: z.string().datetime(),
});

export const aiChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const aiChatMessageSchema = z.object({
  sender: z.string().trim().min(1).max(80),
  role: aiChatMessageRoleSchema,
  content: z.string().trim().min(1).max(4000),
  timestamp: z.string().datetime(),
});

export type AiTaskKind = z.infer<typeof aiTaskKindSchema>;
export type AiTaskStatus = z.infer<typeof aiTaskStatusSchema>;
export type AiStatusMessage = z.infer<typeof aiStatusMessageSchema>;
export type AiChatMessageRole = z.infer<typeof aiChatMessageRoleSchema>;
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;
