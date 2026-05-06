import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/editor/access-denied"
import { EditorShell } from "@/components/editor/editor-shell"
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
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-lg rounded-3xl border border-surface-border bg-surface px-8 py-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-copy-faint">
            Workspace Shell
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-copy-primary">{project.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-copy-muted">
            Canvas, Liveblocks, and AI editing are intentionally deferred. This route now renders
            the protected workspace chrome for the active project.
          </p>
        </div>
      </div>
    </EditorShell>
  )
}
