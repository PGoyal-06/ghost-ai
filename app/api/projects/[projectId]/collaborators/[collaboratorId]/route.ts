import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators/[collaboratorId]">
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { collaboratorId, projectId } = await ctx.params
  const project = await getAccessibleProject(projectId, identity)

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { id: collaboratorId },
    select: { id: true, projectId: true },
  })

  if (!collaborator || collaborator.projectId !== projectId) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.projectCollaborator.delete({ where: { id: collaboratorId } })

  return new Response(null, { status: 204 })
}
