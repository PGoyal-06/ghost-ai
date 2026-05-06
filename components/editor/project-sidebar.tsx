"use client"

import { Plus, X, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProjectDialogs, type Project } from "./project-dialogs-context"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const router = useRouter()
  const { openDialog, ownedProjects, sharedProjects } = useProjectDialogs()

  const navigateTo = (project: Project) => {
    router.push(`/editor/${project.id}`)
    onClose()
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-elevated/95 backdrop-blur-md border-r border-surface-border transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-surface-border shrink-0">
          <span className="text-copy-primary font-semibold text-sm">Projects</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 p-3">
          <Tabs defaultValue="my-projects" className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1 text-xs">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1 text-xs">
                Shared
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="my-projects"
              className="flex-1 flex flex-col mt-0 min-h-0"
            >
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {ownedProjects.length === 0 ? (
                    <div className="flex h-32 items-center justify-center">
                      <p className="text-copy-muted text-sm">No projects yet.</p>
                    </div>
                  ) : (
                    ownedProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => navigateTo(project)}
                        className="group flex items-center justify-between px-2 py-2 rounded-md hover:bg-surface-elevated cursor-pointer"
                      >
                        <span className="text-sm text-copy-primary truncate pr-2">
                          {project.name}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-copy-muted hover:text-copy-primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDialog("rename", project)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDialog("delete", project)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent
              value="shared"
              className="flex-1 flex flex-col mt-0 min-h-0"
            >
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {sharedProjects.length === 0 ? (
                    <div className="flex h-32 items-center justify-center">
                      <p className="text-copy-muted text-sm">No shared projects.</p>
                    </div>
                  ) : (
                    sharedProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => navigateTo(project)}
                        className="group flex items-center justify-between px-2 py-2 rounded-md hover:bg-surface-elevated cursor-pointer"
                      >
                        <span className="text-sm text-copy-primary truncate">
                          {project.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 border-t border-surface-border shrink-0">
          <Button className="w-full gap-2" onClick={() => openDialog("create")}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
