"use client"

import { Plus, X, Pencil, Trash2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProjectDialogs, type Project } from "./project-dialogs-context"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { openDialog, ownedProjects, sharedProjects } = useProjectDialogs()
  const activeProjectId = pathname.startsWith("/editor/") ? pathname.split("/")[2] : null

  const navigateTo = (project: Project) => {
    router.push(`/editor/${project.id}`)
    onClose()
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-40 bg-base/45 backdrop-blur-[2px]" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed bottom-4 left-4 right-4 top-16 z-50 flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface/92 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-in-out md:right-auto md:w-[21rem]",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)] pointer-events-none"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--color-subtle),transparent_45%)] opacity-80" />

        <div className="relative flex items-center justify-between border-b border-surface-border/80 px-5 py-4 shrink-0">
          <span className="text-sm font-semibold text-copy-primary">Projects</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-copy-muted hover:bg-subtle/80 hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col p-4">
          <Tabs defaultValue="my-projects" className="flex flex-col flex-1 min-h-0">
            <TabsList className="h-10 w-full rounded-2xl border border-surface-border/70 bg-subtle/70 p-1">
              <TabsTrigger
                value="my-projects"
                className="flex-1 rounded-xl text-xs font-medium text-copy-muted data-active:bg-base data-active:text-copy-primary data-active:shadow-none"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="flex-1 rounded-xl text-xs font-medium text-copy-muted data-active:bg-base data-active:text-copy-primary data-active:shadow-none"
              >
                Shared
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="my-projects"
              className="mt-4 flex min-h-0 flex-1 flex-col"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {ownedProjects.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-surface-border/80 bg-base/35">
                      <p className="text-copy-muted text-sm">No projects yet.</p>
                    </div>
                  ) : (
                    ownedProjects.map((project) => (
                      <div
                        key={project.id}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-2xl border px-3 py-3 transition-all",
                          activeProjectId === project.id
                            ? "border-brand/25 bg-accent-dim"
                            : "border-transparent bg-transparent hover:border-surface-border/70 hover:bg-subtle/55"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => navigateTo(project)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              activeProjectId === project.id ? "bg-brand" : "bg-copy-faint"
                            )}
                          />
                          <span
                            className={cn(
                              "block truncate pr-2 text-sm font-medium",
                              activeProjectId === project.id ? "text-copy-primary" : "text-copy-secondary"
                            )}
                          >
                            {project.name}
                          </span>
                        </button>
                        <div
                          className={cn(
                            "flex items-center gap-1 transition-opacity",
                            activeProjectId === project.id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-copy-muted hover:bg-base/70 hover:text-copy-primary"
                            onClick={() => openDialog("rename", project)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-copy-muted hover:bg-state-error/10 hover:text-state-error"
                            onClick={() => openDialog("delete", project)}
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
              className="mt-4 flex min-h-0 flex-1 flex-col"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {sharedProjects.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-surface-border/80 bg-base/35">
                      <p className="text-copy-muted text-sm">No shared projects.</p>
                    </div>
                  ) : (
                    sharedProjects.map((project) => (
                      <button
                        type="button"
                        key={project.id}
                        onClick={() => navigateTo(project)}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                          activeProjectId === project.id
                            ? "border-brand/25 bg-accent-dim"
                            : "border-transparent bg-transparent hover:border-surface-border/70 hover:bg-subtle/55"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            activeProjectId === project.id ? "bg-brand" : "bg-copy-faint"
                          )}
                        />
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            activeProjectId === project.id ? "text-copy-primary" : "text-copy-secondary"
                          )}
                        >
                          {project.name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="relative shrink-0 border-t border-surface-border/80 p-4">
          <Button className="h-11 w-full rounded-2xl gap-2 text-sm font-semibold" onClick={() => openDialog("create")}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
