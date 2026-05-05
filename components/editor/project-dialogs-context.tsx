"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type DialogType = "create" | "rename" | "delete" | null

export interface Project {
  id: string
  name: string
  slug: string
  isOwned: boolean
}

interface ProjectDialogsContextType {
  isOpen: DialogType
  activeProject: Project | null
  openDialog: (type: DialogType, project?: Project) => void
  closeDialog: () => void
  projects: Project[]
  addProject: (name: string, slug: string) => void
  updateProject: (id: string, name: string, slug: string) => void
  deleteProject: (id: string) => void
}

const ProjectDialogsContext = createContext<ProjectDialogsContextType | undefined>(undefined)

export function ProjectDialogsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState<DialogType>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([
    { id: "1", name: "Alpha Architecture", slug: "alpha-architecture", isOwned: true },
    { id: "2", name: "Beta Platform", slug: "beta-platform", isOwned: true },
    { id: "3", name: "Gamma Core", slug: "gamma-core", isOwned: false },
  ])

  const openDialog = (type: DialogType, project?: Project) => {
    setIsOpen(type)
    setActiveProject(project || null)
  }

  const closeDialog = () => {
    setIsOpen(null)
    // Wait a tick before clearing project so exit animations don't flash empty state
    setTimeout(() => setActiveProject(null), 300)
  }

  const addProject = (name: string, slug: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substring(7),
      name,
      slug,
      isOwned: true,
    }
    setProjects((prev) => [...prev, newProject])
  }

  const updateProject = (id: string, name: string, slug: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, slug } : p))
    )
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <ProjectDialogsContext.Provider
      value={{
        isOpen,
        activeProject,
        openDialog,
        closeDialog,
        projects,
        addProject,
        updateProject,
        deleteProject,
      }}
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
