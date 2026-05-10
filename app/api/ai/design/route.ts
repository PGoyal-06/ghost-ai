import { tasks } from "@trigger.dev/sdk"
import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { createRunPublicToken } from "@/lib/trigger-auth"

interface DesignTriggerRequestBody {
  prompt?: unknown
  roomId?: unknown
  projectId?: unknown
}

function parseDesignTriggerBody(body: DesignTriggerRequestBody) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
  const roomId = typeof body.roomId === "string" ? body.roomId.trim() : ""
  const rawProjectId =
    typeof body.projectId === "string" ? body.projectId.trim() : ""
  const projectId = rawProjectId || roomId

  if (!prompt) {
    return { error: "prompt is required" as const }
  }

  if (!roomId) {
    return { error: "roomId is required" as const }
  }

  if (!projectId) {
    return { error: "projectId is required" as const }
  }

  return {
    prompt,
    roomId,
    projectId,
  }
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as DesignTriggerRequestBody
  const parsedBody = parseDesignTriggerBody(body)

  if ("error" in parsedBody) {
    return Response.json({ error: parsedBody.error }, { status: 400 })
  }

  const project = await getAccessibleProject(parsedBody.projectId, identity)

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (parsedBody.roomId !== project.id) {
    return Response.json({ error: "roomId must match projectId" }, { status: 400 })
  }

  try {
    const handle = await tasks.trigger("design-agent", {
      prompt: parsedBody.prompt,
      roomId: parsedBody.roomId,
    })

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId: identity.userId,
      },
    })

    const publicToken = await createRunPublicToken(handle.id)

    return Response.json({ runId: handle.id, publicToken }, { status: 202 })
  } catch (error) {
    console.error("Failed to trigger design-agent task", error)

    return Response.json(
      { error: "Failed to trigger design task" },
      { status: 500 }
    )
  }
}
