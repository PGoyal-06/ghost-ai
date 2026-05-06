"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Mail, Trash2, Users } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ShareDialogProps {
  canManageAccess: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  projectId: string
  projectName: string
}

interface Collaborator {
  createdAt: string
  displayName: string | null
  email: string
  id: string
  imageUrl: string | null
}

function getInitials(displayName: string | null, email: string) {
  if (displayName) {
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")

    if (initials) {
      return initials
    }
  }

  return email.slice(0, 1).toUpperCase()
}

export function ShareDialog({
  canManageAccess,
  onOpenChange,
  open,
  projectId,
  projectName,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    async function loadCollaborators() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/projects/${projectId}/collaborators`, {
          cache: "no-store",
        })
        const payload = (await response.json().catch(() => null)) as
          | { collaborators?: Collaborator[]; error?: string }
          | null

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load collaborators")
        }

        setCollaborators(payload?.collaborators ?? [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load collaborators")
      } finally {
        setIsLoading(false)
      }
    }

    void loadCollaborators()
  }, [open, projectId])

  useEffect(() => {
    if (open && canManageAccess && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [canManageAccess, open])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  async function refreshCollaborators() {
    const response = await fetch(`/api/projects/${projectId}/collaborators`, {
      cache: "no-store",
    })
    const payload = (await response.json().catch(() => null)) as
      | { collaborators?: Collaborator[]; error?: string }
      | null

    if (!response.ok) {
      throw new Error(payload?.error ?? "Failed to load collaborators")
    }

    setCollaborators(payload?.collaborators ?? [])
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { collaborator?: Collaborator; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to invite collaborator")
      }

      setEmail("")
      await refreshCollaborators()
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to invite collaborator")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemove(collaboratorId: string) {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "Failed to remove collaborator")
      }

      await refreshCollaborators()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove collaborator")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${projectId}`)
      setCopied(true)
    } catch {
      setError("Failed to copy project link")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Share Project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            {canManageAccess
              ? `Invite collaborators to ${projectName} and manage access by email.`
              : `You can view who has access to ${projectName}, but only the owner can manage sharing.`}
          </DialogDescription>
        </DialogHeader>

        {canManageAccess ? (
          <div className="rounded-2xl border border-surface-border bg-elevated px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-copy-primary">Project link</p>
                <p className="truncate text-xs text-copy-muted">{`/editor/${projectId}`}</p>
              </div>
              <Button
                type="button"
                variant={copied ? "secondary" : "outline"}
                onClick={handleCopyLink}
                className="border-surface-border bg-surface text-copy-primary hover:bg-subtle"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        ) : null}

        {canManageAccess ? (
          <form onSubmit={handleInvite} className="rounded-2xl border border-surface-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-copy-faint" />
                <Input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Invite by email"
                  disabled={isSubmitting}
                  className="pl-9 text-copy-primary"
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !email.trim()}>
                Invite
              </Button>
            </div>
          </form>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-state-error/40 bg-state-error/10 px-3 py-2 text-sm text-state-error">
            {error}
          </p>
        ) : null}

        <div className="rounded-2xl border border-surface-border bg-surface">
          <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
            <Users className="h-4 w-4 text-copy-secondary" />
            <div>
              <p className="text-sm font-medium text-copy-primary">Collaborators</p>
              <p className="text-xs text-copy-muted">
                {canManageAccess
                  ? "People who can access and edit this workspace."
                  : "You have read-only visibility into the collaborator list."}
              </p>
            </div>
          </div>

          <ScrollArea className="max-h-72">
            <div className="p-3">
              {isLoading ? (
                <div className="flex h-28 items-center justify-center text-sm text-copy-muted">
                  Loading collaborators...
                </div>
              ) : collaborators.length === 0 ? (
                <div className="flex h-28 items-center justify-center text-sm text-copy-muted">
                  No collaborators yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center gap-3 rounded-xl border border-surface-border bg-elevated px-3 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-dim text-sm font-medium text-brand">
                        {collaborator.imageUrl ? (
                          <div
                            aria-label={collaborator.displayName ?? collaborator.email}
                            className="h-full w-full bg-cover bg-center"
                            role="img"
                            style={{ backgroundImage: `url(${collaborator.imageUrl})` }}
                          />
                        ) : (
                          getInitials(collaborator.displayName, collaborator.email)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-copy-primary">
                          {collaborator.displayName ?? collaborator.email}
                        </p>
                        <p
                          className={cn(
                            "truncate text-xs",
                            collaborator.displayName ? "text-copy-muted" : "text-copy-faint"
                          )}
                        >
                          {collaborator.email}
                        </p>
                      </div>

                      {canManageAccess ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                          onClick={() => handleRemove(collaborator.id)}
                          className="h-8 w-8 text-state-error hover:bg-state-error/10 hover:text-state-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-surface-border bg-elevated text-copy-primary hover:bg-subtle"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
