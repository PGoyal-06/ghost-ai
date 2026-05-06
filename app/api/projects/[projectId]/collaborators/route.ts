import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"
import {
  listProjectCollaborators,
  normalizeCollaboratorEmail,
} from "@/lib/project-collaborators"
import { prisma } from "@/lib/prisma"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const project = await getAccessibleProject(projectId, identity)

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })

  const collaborators = await listProjectCollaborators(projectId)

  return Response.json({
    canManageAccess: project.ownerId === identity.userId,
    collaborators,
  })
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const project = await getAccessibleProject(projectId, identity)

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const email =
    typeof body.email === "string" ? normalizeCollaboratorEmail(body.email) : ""

  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 })
  }

  if (identity.emails.some((identityEmail) => normalizeCollaboratorEmail(identityEmail) === email)) {
    return Response.json({ error: "The project owner already has access" }, { status: 400 })
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
  })

  if (existing) {
    return Response.json({ error: "That collaborator already has access" }, { status: 409 })
  }

  await prisma.projectCollaborator.create({
    data: {
      projectId,
      email,
    },
  })

  const collaborators = await listProjectCollaborators(projectId)
  const collaborator = collaborators.find((item) => item.email === email) ?? null

  return Response.json({ collaborator }, { status: 201 })
}
