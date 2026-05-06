import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export interface CurrentProjectIdentity {
  userId: string
  primaryEmail: string | null
  emails: string[]
}

export interface AccessibleProject {
  id: string
  name: string
  ownerId: string
}

export async function getCurrentProjectIdentity(): Promise<CurrentProjectIdentity | null> {
  const user = await currentUser()

  if (!user) {
    return null
  }

  return {
    userId: user.id,
    primaryEmail: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
    emails: user.emailAddresses.map((email) => email.emailAddress),
  }
}

export async function getAccessibleProject(
  projectId: string,
  identity?: CurrentProjectIdentity | null
): Promise<AccessibleProject | null> {
  const resolvedIdentity = identity ?? (await getCurrentProjectIdentity())

  if (!resolvedIdentity) {
    return null
  }

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: resolvedIdentity.userId },
        { collaborators: { some: { email: { in: resolvedIdentity.emails } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  })
}

export async function hasProjectAccess(
  projectId: string,
  identity?: CurrentProjectIdentity | null
): Promise<boolean> {
  const project = await getAccessibleProject(projectId, identity)
  return project !== null
}
