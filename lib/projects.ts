import { getCurrentProjectIdentity } from "./project-access";
import { prisma } from "./prisma";

export interface Project {
  id: string;
  name: string;
  isOwned: boolean;
}

interface OwnedProjectRow {
  id: string;
  name: string;
}

interface CollaborationRow {
  project: { id: string; name: string };
}

export async function getProjects(): Promise<{
  owned: Project[];
  shared: Project[];
}> {
  const identity = await getCurrentProjectIdentity();
  if (!identity) return { owned: [], shared: [] };

  const [ownedRaw, collaborations] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: identity.userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }) as Promise<OwnedProjectRow[]>,
    prisma.projectCollaborator.findMany({
      where: { email: { in: identity.emails } },
      include: { project: { select: { id: true, name: true } } },
    }) as Promise<CollaborationRow[]>,
  ]);

  const ownedIds = new Set(ownedRaw.map((p) => p.id));

  return {
    owned: ownedRaw.map((p) => ({
      ...p,
      isOwned: true as const,
    })),
    shared: collaborations
      .filter((c) => !ownedIds.has(c.project.id))
      .map((c) => ({
        id: c.project.id,
        name: c.project.name,
        isOwned: false as const,
      })),
  };
}
