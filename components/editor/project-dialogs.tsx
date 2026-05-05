"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectDialogs } from "./project-dialogs-context"
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
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
}

export function ProjectDialogs() {
  const { isOpen, activeProject, closeDialog, addProject, updateProject, deleteProject } = useProjectDialogs()
  
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset states when dialog opens or project changes
  useEffect(() => {
    if (isOpen === "rename" && activeProject) {
      setName(activeProject.name)
      setSlug(activeProject.slug)
    } else {
      setName("")
      setSlug("")
    }
    setIsSubmitting(false)
  }, [isOpen, activeProject])

  // Focus input when dialog opens
  useEffect(() => {
    if ((isOpen === "create" || isOpen === "rename") && inputRef.current) {
      // Small timeout to ensure dialog animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Update slug automatically when typing in create mode
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    if (isOpen === "create") {
      setSlug(slugify(newName))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isOpen === "delete") {
      setIsSubmitting(true)
      // Mock API call
      setTimeout(() => {
        if (activeProject) deleteProject(activeProject.id)
        setIsSubmitting(false)
        closeDialog()
      }, 500)
      return
    }

    if (!name.trim()) return

    setIsSubmitting(true)
    // Mock API call
    setTimeout(() => {
      if (isOpen === "create") {
        addProject(name, slug)
      } else if (isOpen === "rename" && activeProject) {
        updateProject(activeProject.id, name, slug)
      }
      setIsSubmitting(false)
      closeDialog()
    }, 500)
  }

  return (
    <>
      {/* Create / Rename Dialog */}
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
                onChange={handleNameChange}
                placeholder="Project name"
                disabled={isSubmitting}
                className="text-white"
              />
              {isOpen === "create" && name && (
                <p className="text-xs text-copy-muted mt-2">
                  Slug: <span className="text-copy-primary">{slug}</span>
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

      {/* Delete Dialog */}
      <Dialog open={isOpen === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the project &ldquo;{activeProject?.name}&rdquo;? This action cannot be undone.
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
