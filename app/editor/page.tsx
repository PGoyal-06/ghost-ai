"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjectDialogs } from "@/components/editor/project-dialogs-context"

export default function EditorPage() {
  const { openDialog } = useProjectDialogs()

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-semibold text-copy-primary mb-2">
        Create a project or open an existing one
      </h1>
      <p className="text-sm text-copy-muted max-w-md mb-8">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <Button onClick={() => openDialog("create")} className="gap-2">
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  )
}
