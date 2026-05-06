import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/editor/access-denied"
import { EditorShell } from "@/components/editor/editor-shell"
import { CanvasWrapper } from "@/components/editor/canvas-wrapper"
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
    <EditorShell
      projectId={project.id}
      projectName={project.name}
      isProjectOwner={project.ownerId === identity.userId}
    >
      <CanvasWrapper roomId={project.id} />
    </EditorShell>
  )
}
