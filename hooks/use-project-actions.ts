"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useProjectDialogs } from "@/components/editor/project-dialogs-context"

export function useProjectActions() {
  const router = useRouter()
  const pathname = usePathname()
  const { closeDialog } = useProjectDialogs()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function create(name: string) {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Failed to create project")
      const project = (await res.json()) as { id: string }
      closeDialog()
      router.push(`/editor/${project.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function rename(projectId: string, name: string) {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Failed to rename project")
      closeDialog()
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function remove(projectId: string) {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")
      closeDialog()
      if (pathname.startsWith(`/editor/${projectId}`)) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { create, rename, remove, isSubmitting }
}
