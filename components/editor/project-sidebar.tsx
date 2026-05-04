"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={onClose} />
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
              className="flex-1 flex items-center justify-center mt-0"
            >
              <p className="text-copy-muted text-sm">No projects yet.</p>
            </TabsContent>
            <TabsContent
              value="shared"
              className="flex-1 flex items-center justify-center mt-0"
            >
              <p className="text-copy-muted text-sm">No shared projects.</p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 border-t border-surface-border shrink-0">
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
