"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { ShareDialog } from "./share-dialog"
import { AiSidebar } from "./ai-sidebar"
import type { SaveStatus } from "@/hooks/useCanvasAutosave"

interface EditorShellProps {
  children: React.ReactNode
  isProjectOwner?: boolean
  projectId?: string
  projectName?: string
  onOpenTemplatesModal?: () => void
  saveStatus?: SaveStatus
  onManualSave?: () => void
}

export function EditorShell({
  children,
  isProjectOwner = false,
  projectId,
  projectName,
  onOpenTemplatesModal,
  saveStatus,
  onManualSave,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const isWorkspace = Boolean(projectName)

  return (
    <div className="h-screen overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenShareDialog={
          isWorkspace ? () => setIsShareDialogOpen(true) : undefined
        }
        projectName={projectName}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={
          isWorkspace ? () => setIsAiSidebarOpen((prev) => !prev) : undefined
        }
        onOpenTemplatesModal={isWorkspace ? onOpenTemplatesModal : undefined}
        saveStatus={isWorkspace ? saveStatus : undefined}
        onManualSave={isWorkspace ? onManualSave : undefined}
      />
      <ProjectSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {isWorkspace && isAiSidebarOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-12 z-30 bg-base/70"
          onClick={() => setIsAiSidebarOpen(false)}
        />
      ) : null}

      <main className="h-full pt-12">
        <div className="flex h-full">
          <section className="min-w-0 flex-1">{children}</section>

          {isWorkspace ? (
            <AiSidebar isOpen={isAiSidebarOpen} onClose={() => setIsAiSidebarOpen(false)} />
          ) : null}
        </div>
      </main>

      {isWorkspace && projectId && projectName ? (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          projectId={projectId}
          projectName={projectName}
          canManageAccess={isProjectOwner}
        />
      ) : null}
    </div>
  )
}
