import { getCurrentProjectIdentity } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { createRunPublicToken } from "@/lib/trigger-auth";

interface SpecTokenRequestBody {
  runId?: unknown;
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SpecTokenRequestBody;
  const runId = typeof body.runId === "string" ? body.runId.trim() : "";

  if (!runId) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId,
      userId: identity.userId,
    },
    select: {
      runId: true,
    },
  });

  if (!taskRun) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const publicToken = await createRunPublicToken(taskRun.runId);

    return Response.json({ publicToken });
  } catch (error) {
    console.error("Failed to create Trigger.dev public token", error);

    return Response.json(
      { error: "Failed to create public token" },
      { status: 500 }
    );
  }
}
