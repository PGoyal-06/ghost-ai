import { del, get, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export interface PersistProjectSpecInput {
  projectId: string;
  markdown: string;
}

export interface StoredProjectSpec {
  id: string;
  projectId: string;
  filePath: string;
  createdAt: Date;
}

export interface PersistedProjectSpec extends StoredProjectSpec {
  downloadPath: string;
}

export interface ProjectSpecSummary {
  id: string;
  projectId: string;
  createdAt: Date;
  filename: string;
  downloadPath: string;
}

export function getProjectSpecDownloadPath(
  projectId: string,
  specId: string
): string {
  return `/api/projects/${projectId}/specs/${specId}/download`;
}

export async function persistProjectSpec({
  projectId,
  markdown,
}: PersistProjectSpecInput): Promise<PersistedProjectSpec> {
  const specId = crypto.randomUUID();
  const blob = await put(`specs/${projectId}/${specId}.md`, markdown, {
    access: "private",
    addRandomSuffix: false,
    contentType: "text/markdown; charset=utf-8",
  });

  try {
    const record = await prisma.projectSpec.create({
      data: {
        id: specId,
        projectId,
        filePath: blob.url,
      },
      select: {
        id: true,
        projectId: true,
        filePath: true,
        createdAt: true,
      },
    });

    return {
      ...record,
      downloadPath: getProjectSpecDownloadPath(projectId, record.id),
    };
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

export async function getStoredProjectSpec(
  projectId: string,
  specId: string
): Promise<StoredProjectSpec | null> {
  return prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      id: true,
      projectId: true,
      filePath: true,
      createdAt: true,
    },
  });
}

export async function getStoredProjectSpecBlob(filePath: string) {
  return get(filePath, { access: "private" });
}

export async function getStoredProjectSpecContent(filePath: string) {
  const blob = await getStoredProjectSpecBlob(filePath);

  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return null;
  }

  return new Response(blob.stream).text();
}

export async function listStoredProjectSpecs(
  projectId: string,
  projectName: string
): Promise<ProjectSpecSummary[]> {
  const specs: Array<{
    id: string;
    projectId: string;
    createdAt: Date;
  }> = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      projectId: true,
      createdAt: true,
    },
  });

  return specs.map((spec) => ({
    ...spec,
    filename: buildProjectSpecFilename(projectName, spec.createdAt),
    downloadPath: getProjectSpecDownloadPath(projectId, spec.id),
  }));
}

export function buildProjectSpecFilename(
  projectName: string,
  createdAt: Date
): string {
  const date = createdAt.toISOString().slice(0, 10);
  const baseName = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${baseName || "project"}-spec-${date}.md`;
}
