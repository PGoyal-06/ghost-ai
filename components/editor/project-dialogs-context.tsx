"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { Project } from "@/lib/projects"

export type { Project }

export type DialogType = "create" | "rename" | "delete" | null

interface ProjectDialogsContextType {
  isOpen: DialogType
  activeProject: Project | null
  openDialog: (type: DialogType, project?: Project) => void
  closeDialog: () => void
  ownedProjects: Project[]
  sharedProjects: Project[]
}

const ProjectDialogsContext = createContext<ProjectDialogsContextType | undefined>(undefined)

interface ProjectDialogsProviderProps {
  children: ReactNode
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function ProjectDialogsProvider({
  children,
  ownedProjects,
  sharedProjects,
}: ProjectDialogsProviderProps) {
  const [isOpen, setIsOpen] = useState<DialogType>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const openDialog = (type: DialogType, project?: Project) => {
    setIsOpen(type)
    setActiveProject(project ?? null)
  }

  const closeDialog = () => {
    setIsOpen(null)
    setTimeout(() => setActiveProject(null), 300)
  }

  return (
    <ProjectDialogsContext.Provider
      value={{ isOpen, activeProject, openDialog, closeDialog, ownedProjects, sharedProjects }}
    >
      {children}
    </ProjectDialogsContext.Provider>
  )
}

export function useProjectDialogs() {
  const context = useContext(ProjectDialogsContext)
  if (context === undefined) {
    throw new Error("useProjectDialogs must be used within a ProjectDialogsProvider")
  }
  return context
}
