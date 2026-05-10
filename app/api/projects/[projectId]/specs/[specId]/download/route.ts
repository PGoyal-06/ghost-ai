import {
  buildProjectSpecFilename,
  getStoredProjectSpec,
  getStoredProjectSpecBlob,
} from "@/lib/project-specs";
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs/[specId]/download">
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await ctx.params;
  const project = await getAccessibleProject(projectId, identity);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await getStoredProjectSpec(projectId, specId);

  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 });
  }

  try {
    const blob = await getStoredProjectSpecBlob(spec.filePath);

    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return Response.json({ error: "Spec not found" }, { status: 404 });
    }

    return new Response(blob.stream, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${buildProjectSpecFilename(project.name, spec.createdAt)}"`,
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Failed to download project spec", {
      error,
      projectId,
      specId,
    });

    return Response.json({ error: "Spec not found" }, { status: 404 });
  }
}
