import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceView } from "@/components/editor/workspace-view"
import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"

export default async function EditorWorkspacePage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const identity = await getCurrentProjectIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const project = await getAccessibleProject(roomId, identity)

  if (!project) {
    return <AccessDenied />
  }

  return (
    <WorkspaceView
      projectId={project.id}
      projectName={project.name}
      isProjectOwner={project.ownerId === identity.userId}
    />
  )
}
