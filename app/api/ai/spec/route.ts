import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { specTriggerRequestSchema } from "@/lib/ai/spec-generation";
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

function getValidationError(error: z.ZodError) {
  return {
    error: "Invalid request body",
    details: error.flatten(),
  };
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = specTriggerRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(getValidationError(parsedBody.error), { status: 400 });
  }

  const project = await getAccessibleProject(parsedBody.data.roomId, identity);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const handle = await tasks.trigger("generate-spec", {
      projectId: project.id,
      roomId: parsedBody.data.roomId,
      chatHistory: parsedBody.data.chatHistory,
      nodes: parsedBody.data.nodes,
      edges: parsedBody.data.edges,
    });

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId: identity.userId,
      },
    });

    return Response.json({ runId: handle.id }, { status: 202 });
  } catch (error) {
    console.error("Failed to trigger generate-spec task", error);

    return Response.json(
      { error: "Failed to trigger spec generation" },
      { status: 500 }
    );
  }
}
