import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-context"
import { getProjects } from "@/lib/projects"

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const { owned, shared } = await getProjects()

  return (
    <ProjectDialogsProvider ownedProjects={owned} sharedProjects={shared}>
      {children}
      <ProjectDialogs />
    </ProjectDialogsProvider>
  )
}
