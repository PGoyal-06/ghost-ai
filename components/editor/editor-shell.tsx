"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { ProjectDialogsProvider } from "./project-dialogs-context"
import { ProjectDialogs } from "./project-dialogs"
import type { Project } from "@/lib/projects"

interface EditorShellProps {
  children: React.ReactNode
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function EditorShell({ children, ownedProjects, sharedProjects }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <ProjectDialogsProvider ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      <div className="h-screen bg-base overflow-hidden">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="pt-12 h-full">{children}</main>
        <ProjectDialogs />
      </div>
    </ProjectDialogsProvider>
  )
}
