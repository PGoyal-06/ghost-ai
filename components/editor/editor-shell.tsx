"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { ShareDialog } from "./share-dialog"

interface EditorShellProps {
  children: React.ReactNode
  isProjectOwner?: boolean
  projectId?: string
  projectName?: string
  onOpenTemplatesModal?: () => void
}

export function EditorShell({
  children,
  isProjectOwner = false,
  projectId,
  projectName,
  onOpenTemplatesModal,
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
            <aside
              className={`fixed bottom-0 right-0 top-12 z-40 w-full max-w-sm border-l border-surface-border bg-elevated/95 backdrop-blur-md transition-transform duration-200 ease-in-out md:max-w-md ${
                isAiSidebarOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="border-b border-surface-border px-5 py-4">
                  <p className="text-sm font-semibold text-copy-primary">AI Assistant</p>
                  <p className="mt-1 text-xs leading-relaxed text-copy-muted">
                    Chat-driven architecture editing will live here in a later feature.
                  </p>
                </div>
                <div className="flex flex-1 items-center justify-center px-6 text-center">
                  <div>
                    <p className="text-sm font-medium text-copy-secondary">
                      AI workspace placeholder
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-copy-muted">
                      Use the navbar toggle to open and close this panel while the editor shell is
                      being wired.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
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
