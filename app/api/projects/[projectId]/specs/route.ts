import { listStoredProjectSpecs } from "@/lib/project-specs"
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access"

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs">
) {
  const identity = await getCurrentProjectIdentity()

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await ctx.params
  const project = await getAccessibleProject(projectId, identity)

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const specs = await listStoredProjectSpecs(projectId, project.name)

  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      createdAt: spec.createdAt.toISOString(),
      downloadPath: spec.downloadPath,
      filename: spec.filename,
    })),
  })
}
