import {
  getStoredProjectSpec,
  getStoredProjectSpecContent,
} from "@/lib/project-specs"
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access"

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs/[specId]">
) {
  const identity = await getCurrentProjectIdentity()

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId, specId } = await ctx.params
  const project = await getAccessibleProject(projectId, identity)

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const spec = await getStoredProjectSpec(projectId, specId)

  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 })
  }

  try {
    const content = await getStoredProjectSpecContent(spec.filePath)

    if (!content) {
      return Response.json({ error: "Spec not found" }, { status: 404 })
    }

    return new Response(content, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/markdown; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Failed to fetch project spec content", {
      error,
      projectId,
      specId,
    })

    return Response.json({ error: "Spec not found" }, { status: 404 })
  }
}
