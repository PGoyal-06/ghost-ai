import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export interface ProjectCollaboratorDetails {
  createdAt: string
  displayName: string | null
  email: string
  id: string
  imageUrl: string | null
}

export function normalizeCollaboratorEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function listProjectCollaborators(
  projectId: string
): Promise<ProjectCollaboratorDetails[]> {
  const collaborators: Array<{ createdAt: Date; email: string; id: string }> =
    await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      email: true,
      id: true,
    },
    })

  if (collaborators.length === 0) {
    return []
  }

  const client = await clerkClient()
  const emails = Array.from(
    new Set(collaborators.map((collaborator) => normalizeCollaboratorEmail(collaborator.email)))
  )
  const usersResponse = await client.users.getUserList({
    emailAddress: emails,
    limit: emails.length,
  })
  const usersByEmail = new Map<
    string,
    { displayName: string | null; imageUrl: string | null }
  >()

  for (const user of usersResponse.data) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null

    for (const emailAddress of user.emailAddresses) {
      usersByEmail.set(normalizeCollaboratorEmail(emailAddress.emailAddress), {
        displayName,
        imageUrl: user.imageUrl ?? null,
      })
    }
  }

  return collaborators.map((collaborator) => {
    const user = usersByEmail.get(normalizeCollaboratorEmail(collaborator.email))

    return {
      createdAt: collaborator.createdAt.toISOString(),
      displayName: user?.displayName ?? null,
      email: collaborator.email,
      id: collaborator.id,
      imageUrl: user?.imageUrl ?? null,
    }
  })
}
