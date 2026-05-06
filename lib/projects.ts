import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export interface Project {
  id: string
  name: string
  isOwned: boolean
}

export async function getProjects(): Promise<{ owned: Project[]; shared: Project[] }> {
  const user = await currentUser()
  if (!user) return { owned: [], shared: [] }

  const emails = user.emailAddresses.map((e) => e.emailAddress)

  const [ownedRaw, collaborations] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.projectCollaborator.findMany({
      where: { email: { in: emails } },
      include: { project: { select: { id: true, name: true } } },
    }),
  ])

  return {
    owned: ownedRaw.map((p: { id: string; name: string }) => ({ ...p, isOwned: true as const })),
    shared: (collaborations as Array<{ project: { id: string; name: string } }>).map((c) => ({
      id: c.project.id,
      name: c.project.name,
      isOwned: false as const,
    })),
  }
}
