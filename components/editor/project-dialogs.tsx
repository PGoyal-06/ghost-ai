"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectDialogs } from "./project-dialogs-context"
import { useProjectActions } from "@/hooks/use-project-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
}

export function ProjectDialogs() {
  const { isOpen, activeProject, closeDialog } = useProjectDialogs()
  const { create, rename, remove, isSubmitting } = useProjectActions()

  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen === "rename" && activeProject) {
      setName(activeProject.name)
    } else if (isOpen === "create") {
      setName("")
      setSuffix(Math.random().toString(36).slice(2, 6))
    }
  }, [isOpen, activeProject])

  useEffect(() => {
    if ((isOpen === "create" || isOpen === "rename") && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const roomId = name ? `${slugify(name)}-${suffix}` : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isOpen === "create" && name.trim()) {
      await create(name.trim())
    } else if (isOpen === "rename" && activeProject && name.trim()) {
      await rename(activeProject.id, name.trim())
    } else if (isOpen === "delete" && activeProject) {
      await remove(activeProject.id)
    }
  }

  return (
    <>
      <Dialog
        open={isOpen === "create" || isOpen === "rename"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">
                {isOpen === "create" ? "Create Project" : "Rename Project"}
              </DialogTitle>
              <DialogDescription>
                {isOpen === "create"
                  ? "Enter a name for your new architecture workspace."
                  : `Renaming project "${activeProject?.name}".`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                disabled={isSubmitting}
                className="text-white"
              />
              {isOpen === "create" && roomId && (
                <p className="text-xs text-copy-muted mt-2">
                  Room ID: <span className="text-copy-primary">{roomId}</span>
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Saving..." : isOpen === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{activeProject?.name}&rdquo;? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
