import { logger, metadata, task, type RunMetadata } from "@trigger.dev/sdk";
import {
  generateMarkdownSpec,
  generateSpecPayloadSchema,
  type GenerateSpecPayload,
} from "@/lib/ai/spec-generation";
import { persistProjectSpec } from "@/lib/project-specs";

interface GenerateSpecTaskOutput {
  specId: string;
  projectId: string;
  downloadPath: string;
}

interface SpecRunMetadataFields {
  kind: "spec";
  status: "start" | "processing" | "complete" | "error";
  roomId: string;
  projectId: string;
  specId?: string;
  nodeCount: number;
  edgeCount: number;
  chatMessageCount: number;
  startedAt: string;
  completedAt?: string;
  outputLength?: number;
  error?: string;
}

function buildSpecRunMetadata(
  payload: GenerateSpecPayload,
  status: SpecRunMetadataFields["status"],
  startedAt: string,
  extra?: Partial<SpecRunMetadataFields>
): RunMetadata {
  const nextMetadata: RunMetadata = {
    kind: "spec",
    status,
    roomId: payload.roomId,
    projectId: payload.projectId,
    nodeCount: payload.nodes.length,
    edgeCount: payload.edges.length,
    chatMessageCount: payload.chatHistory.length,
    startedAt,
  };

  if (extra?.completedAt) {
    nextMetadata.completedAt = extra.completedAt;
  }

  if (typeof extra?.outputLength === "number") {
    nextMetadata.outputLength = extra.outputLength;
  }

  if (extra?.specId) {
    nextMetadata.specId = extra.specId;
  }

  if (extra?.error) {
    nextMetadata.error = extra.error;
  }

  return nextMetadata;
}

async function updateRunMetadata(nextMetadata: RunMetadata) {
  metadata.replace(nextMetadata);
  await metadata.flush();
}

export const generateSpec = task({
  id: "generate-spec",
  run: async (rawPayload): Promise<GenerateSpecTaskOutput> => {
    const payload = generateSpecPayloadSchema.parse(rawPayload);
    const startedAt = new Date().toISOString();

    await updateRunMetadata(
      buildSpecRunMetadata(payload, "start", startedAt)
    );

    logger.info("Starting Markdown spec generation", {
      projectId: payload.projectId,
      roomId: payload.roomId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
      chatMessageCount: payload.chatHistory.length,
    });

    try {
      await updateRunMetadata(
        buildSpecRunMetadata(payload, "processing", startedAt)
      );

      logger.info("Generating Markdown spec with Gemini", {
        projectId: payload.projectId,
        roomId: payload.roomId,
      });

      const markdown = await generateMarkdownSpec(payload);
      const storedSpec = await persistProjectSpec({
        projectId: payload.projectId,
        markdown,
      });
      const completedAt = new Date().toISOString();

      await updateRunMetadata(
        buildSpecRunMetadata(payload, "complete", startedAt, {
          completedAt,
          outputLength: markdown.length,
          specId: storedSpec.id,
        })
      );

      logger.info("Completed Markdown spec generation and persistence", {
        projectId: payload.projectId,
        roomId: payload.roomId,
        specId: storedSpec.id,
        outputLength: markdown.length,
      });

      return {
        specId: storedSpec.id,
        projectId: payload.projectId,
        downloadPath: storedSpec.downloadPath,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ghost AI failed to generate the technical specification.";

      await updateRunMetadata(
        buildSpecRunMetadata(payload, "error", startedAt, {
          error: message,
        })
      );

      logger.error("Markdown spec generation failed", {
        projectId: payload.projectId,
        roomId: payload.roomId,
        error: message,
      });

      throw error;
    }
  },
});
