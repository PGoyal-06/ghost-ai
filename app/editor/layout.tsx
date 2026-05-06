import { EditorShell } from "@/components/editor/editor-shell"
import { getProjects } from "@/lib/projects"

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const { owned, shared } = await getProjects()
  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      {children}
    </EditorShell>
  )
}
