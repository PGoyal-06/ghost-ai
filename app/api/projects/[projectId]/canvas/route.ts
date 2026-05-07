import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { put, get } from "@vercel/blob"
import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"

/**
 * GET /api/projects/[projectId]/canvas
 *
 * Returns the saved canvas JSON for a project.
 * The caller must be the project owner or a collaborator.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const project = await getAccessibleProject(projectId, identity)
  if (!project) return Response.json({ error: "Forbidden" }, { status: 403 })

  // Fetch the blob URL from Prisma
  const full = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  })

  if (!full?.canvasJsonPath) {
    return Response.json({ nodes: [], edges: [] })
  }

  try {
    const result = await get(full.canvasJsonPath, { access: "private" })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return Response.json({ nodes: [], edges: [] })
    }
    const text = await new Response(result.stream).text()
    const data = JSON.parse(text)
    return Response.json(data)
  } catch {
    return Response.json({ nodes: [], edges: [] })
  }
}

/**
 * PUT /api/projects/[projectId]/canvas
 *
 * Saves canvas JSON to Vercel Blob and stores the URL on the project record.
 * Owner or collaborator access required.
 */
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params

  // Verify access (owner or collaborator)
  const identity = await getCurrentProjectIdentity()
  const project = await getAccessibleProject(projectId, identity)
  if (!project) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return Response.json(
      { error: "Body must contain nodes and edges arrays" },
      { status: 400 }
    )
  }

  const canvasJson = JSON.stringify({ nodes: body.nodes, edges: body.edges })

  // Upload to Vercel Blob (overwrites previous blob via addRandomSuffix: false)
  const blob = await put(`canvas/${projectId}.json`, canvasJson, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  })

  // Store the blob URL on the project record
  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  })

  return Response.json({ url: blob.url })
}
