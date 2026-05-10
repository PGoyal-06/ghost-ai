"use client"

import type { ComponentProps } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { AnyTask, RealtimeRun } from "@trigger.dev/core/v3"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import ReactMarkdown from "react-markdown"
import { Download, FileText, Loader2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { CanvasSnapshot } from "@/types/canvas"
import type { AiChatMessage } from "@/types/tasks"

interface ProjectSpecsPanelProps {
  isActive: boolean
  projectId: string
  chatHistory: AiChatMessage[]
  getCanvasSnapshot?: () => CanvasSnapshot
}

interface ProjectSpecListItem {
  id: string
  createdAt: string
  downloadPath: string
  filename: string
}

interface GenerateSpecResponse {
  runId: string
}

interface SpecTokenResponse {
  publicToken: string
}

interface ActiveSpecRun {
  runId: string
  publicToken: string
}

interface GenerateSpecTaskOutput {
  specId: string
}

interface SpecRunTrackerProps {
  publicToken: string
  runId: string
  onComplete: (run: RealtimeRun<AnyTask>) => void
  onError: (error: Error) => void
}

function formatSpecTimestamp(timestamp: string) {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return "Unknown date"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getResponseError(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error
  }

  return null
}

async function readErrorResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as unknown
  return getResponseError(payload) || "Request failed"
}

function parseGenerateSpecResponse(payload: unknown): GenerateSpecResponse | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "runId" in payload &&
    typeof payload.runId === "string" &&
    payload.runId.trim()
  ) {
    return {
      runId: payload.runId,
    }
  }

  return null
}

function parseSpecTokenResponse(payload: unknown): SpecTokenResponse | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "publicToken" in payload &&
    typeof payload.publicToken === "string" &&
    payload.publicToken.trim()
  ) {
    return {
      publicToken: payload.publicToken,
    }
  }

  return null
}

function parseGenerateSpecTaskOutput(output: unknown): GenerateSpecTaskOutput | null {
  if (
    typeof output === "object" &&
    output !== null &&
    "specId" in output &&
    typeof output.specId === "string" &&
    output.specId.trim()
  ) {
    return {
      specId: output.specId,
    }
  }

  return null
}

const markdownComponents = {
  a: ({ className, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      className={cn("text-brand underline underline-offset-4", className)}
      rel={props.target === "_blank" ? "noreferrer" : props.rel}
    />
  ),
  code: ({ className, ...props }: ComponentProps<"code">) => (
    <code
      {...props}
      className={cn(
        "rounded-md bg-base px-1.5 py-0.5 font-mono text-[0.85em] text-copy-primary",
        className
      )}
    />
  ),
  h1: ({ className, ...props }: ComponentProps<"h1">) => (
    <h1
      {...props}
      className={cn("text-2xl font-semibold tracking-tight text-copy-primary", className)}
    />
  ),
  h2: ({ className, ...props }: ComponentProps<"h2">) => (
    <h2 {...props} className={cn("text-xl font-semibold text-copy-primary", className)} />
  ),
  h3: ({ className, ...props }: ComponentProps<"h3">) => (
    <h3 {...props} className={cn("text-lg font-semibold text-copy-primary", className)} />
  ),
  li: ({ className, ...props }: ComponentProps<"li">) => (
    <li {...props} className={cn("text-sm leading-7 text-copy-secondary", className)} />
  ),
  ol: ({ className, ...props }: ComponentProps<"ol">) => (
    <ol {...props} className={cn("ml-5 list-decimal space-y-2", className)} />
  ),
  p: ({ className, ...props }: ComponentProps<"p">) => (
    <p {...props} className={cn("text-sm leading-7 text-copy-secondary", className)} />
  ),
  pre: ({ className, ...props }: ComponentProps<"pre">) => (
    <pre
      {...props}
      className={cn(
        "overflow-x-auto rounded-2xl border border-surface-border bg-base p-4 text-xs text-copy-primary",
        className
      )}
    />
  ),
  strong: ({ className, ...props }: ComponentProps<"strong">) => (
    <strong {...props} className={cn("font-semibold text-copy-primary", className)} />
  ),
  ul: ({ className, ...props }: ComponentProps<"ul">) => (
    <ul {...props} className={cn("ml-5 list-disc space-y-2", className)} />
  ),
}

function SpecRunTracker({
  publicToken,
  runId,
  onComplete,
  onError,
}: SpecRunTrackerProps) {
  const handledErrorRef = useRef(false)

  const { error } = useRealtimeRun(runId, {
    accessToken: publicToken,
    onComplete: (run, realtimeError) => {
      if (realtimeError) {
        onError(realtimeError)
        return
      }

      onComplete(run)
    },
  })

  useEffect(() => {
    handledErrorRef.current = false
  }, [publicToken, runId])

  useEffect(() => {
    if (!error || handledErrorRef.current) {
      return
    }

    handledErrorRef.current = true
    onError(error)
  }, [error, onError])

  return null
}

export function ProjectSpecsPanel({
  isActive,
  projectId,
  chatHistory,
  getCanvasSnapshot,
}: ProjectSpecsPanelProps) {
  const [activeRun, setActiveRun] = useState<ActiveSpecRun | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecListItem | null>(null)
  const [specs, setSpecs] = useState<ProjectSpecListItem[]>([])
  const previewRequestIdRef = useRef(0)

  const loadSpecs = useCallback(
    async (options?: { preserveError?: boolean }) => {
      setIsLoading(true)

      if (!options?.preserveError) {
        setError(null)
      }

      try {
        const response = await fetch(`/api/projects/${projectId}/specs`, {
          cache: "no-store",
        })
        const payload = (await response.json().catch(() => null)) as
          | { specs?: ProjectSpecListItem[]; error?: string }
          | null

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load specs")
        }

        const nextSpecs = payload?.specs ?? []
        setSpecs(nextSpecs)
        return nextSpecs
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load specs"
        setError(message)
        throw loadError
      } finally {
        setIsLoading(false)
      }
    },
    [projectId]
  )

  useEffect(() => {
    if (!isActive) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadSpecs().catch(() => undefined)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isActive, loadSpecs])

  const handlePreviewOpenChange = (open: boolean) => {
    if (open) {
      return
    }

    previewRequestIdRef.current += 1
    setIsPreviewLoading(false)
    setPreviewContent(null)
    setPreviewError(null)
    setSelectedSpec(null)
  }

  const handleSpecSelect = useCallback(
    async (spec: ProjectSpecListItem) => {
      const requestId = previewRequestIdRef.current + 1
      previewRequestIdRef.current = requestId
      setSelectedSpec(spec)
      setIsPreviewLoading(true)
      setPreviewContent(null)
      setPreviewError(null)

      try {
        const response = await fetch(`/api/projects/${projectId}/specs/${spec.id}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(await readErrorResponse(response))
        }

        const content = await response.text()

        if (previewRequestIdRef.current !== requestId) {
          return
        }

        setPreviewContent(content)
      } catch (loadError) {
        if (previewRequestIdRef.current !== requestId) {
          return
        }

        setPreviewError(
          loadError instanceof Error ? loadError.message : "Failed to load spec preview"
        )
      } finally {
        if (previewRequestIdRef.current === requestId) {
          setIsPreviewLoading(false)
        }
      }
    },
    [projectId]
  )

  const triggerSpecRun = useCallback(
    async (snapshot: CanvasSnapshot) => {
      const response = await fetch("/api/ai/spec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: projectId,
          chatHistory,
          nodes: snapshot.nodes,
          edges: snapshot.edges,
        }),
      })

      const payload = (await response.json().catch(() => null)) as unknown

      if (!response.ok) {
        throw new Error(
          getResponseError(payload) || "Ghost AI couldn't start spec generation."
        )
      }

      const parsed = parseGenerateSpecResponse(payload)

      if (!parsed) {
        throw new Error("Ghost AI returned an invalid spec run response.")
      }

      return parsed
    },
    [chatHistory, projectId]
  )

  const createSpecRunToken = useCallback(async (runId: string) => {
    const response = await fetch("/api/ai/spec/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ runId }),
    })

    const payload = (await response.json().catch(() => null)) as unknown

    if (!response.ok) {
      throw new Error(
        getResponseError(payload) || "Ghost AI couldn't subscribe to spec generation."
      )
    }

    const parsed = parseSpecTokenResponse(payload)

    if (!parsed) {
      throw new Error("Ghost AI returned an invalid spec token response.")
    }

    return parsed
  }, [])

  const handleRunError = useCallback((runError: Error | string) => {
    setActiveRun(null)
    setIsGenerating(false)
    setError(
      typeof runError === "string"
        ? runError
        : runError.message || "Ghost AI couldn't finish spec generation."
    )
  }, [])

  const handleRunComplete = useCallback(
    async (run: RealtimeRun<AnyTask>) => {
      setActiveRun(null)
      setIsGenerating(false)

      if (run.status !== "COMPLETED") {
        handleRunError("Ghost AI couldn't finish the technical specification.")
        return
      }

      const output = parseGenerateSpecTaskOutput(run.output)

      try {
        const nextSpecs = await loadSpecs({ preserveError: true })
        setError(null)

        if (!output) {
          return
        }

        const generatedSpec = nextSpecs.find((spec) => spec.id === output.specId)

        if (generatedSpec) {
          void handleSpecSelect(generatedSpec)
        }
      } catch {
        // loadSpecs already sets the visible error state
      }
    },
    [handleRunError, handleSpecSelect, loadSpecs]
  )

  const handleGenerateSpec = async () => {
    if (isGenerating || activeRun) {
      return
    }

    const snapshot = getCanvasSnapshot?.() ?? {
      nodes: [],
      edges: [],
    }

    if (snapshot.nodes.length === 0) {
      setError("Add at least one canvas node before generating a spec.")
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const run = await triggerSpecRun(snapshot)
      const token = await createSpecRunToken(run.runId)

      setActiveRun({
        runId: run.runId,
        publicToken: token.publicToken,
      })
    } catch (generationError) {
      handleRunError(
        generationError instanceof Error
          ? generationError
          : "Ghost AI couldn't start spec generation."
      )
    }
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-copy-muted">Project Specifications</p>
          <Button
            size="sm"
            onClick={() => {
              void handleGenerateSpec()
            }}
            disabled={isGenerating || activeRun !== null}
            className="h-8 px-3 text-xs"
          >
            {isGenerating || activeRun ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating
              </>
            ) : (
              "Generate Spec"
            )}
          </Button>
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl border border-state-error/40 bg-state-error/10 px-3 py-2 text-xs text-copy-primary">
            {error}
          </p>
        ) : null}

        <ScrollArea className="flex-1 pr-1">
          {isLoading && specs.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-surface-border/80 bg-elevated/80">
              <div className="flex items-center gap-2 text-sm text-copy-muted">
                <Loader2 className="h-4 w-4 animate-spin text-ai-text" />
                Loading specs...
              </div>
            </div>
          ) : specs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {specs.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    void handleSpecSelect(spec)
                  }}
                  className="group flex w-full items-start justify-between gap-3 rounded-2xl border border-surface-border/80 bg-elevated/80 p-4 text-left transition-colors hover:border-subtle-border hover:bg-subtle/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-copy-primary">
                          {spec.filename}
                        </p>
                        <p className="text-xs text-copy-muted">
                          {formatSpecTimestamp(spec.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={spec.downloadPath}
                    onClick={(event) => {
                      event.stopPropagation()
                    }}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "shrink-0 rounded-xl border-surface-border bg-base/30 text-copy-muted hover:bg-subtle hover:text-copy-primary"
                    )}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-surface-border/80 bg-elevated/80 px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/15 text-ai-text">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-copy-primary">No specs yet</p>
              <p className="mt-2 max-w-[240px] text-xs leading-6 text-copy-muted">
                Generated project specs will appear here when they are available.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      <Dialog open={selectedSpec !== null} onOpenChange={handlePreviewOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border border-surface-border bg-surface p-0 text-copy-primary sm:max-w-3xl">
          <DialogHeader className="border-b border-surface-border/80 px-6 py-5">
            <DialogTitle className="pr-10 text-copy-primary">
              {selectedSpec?.filename ?? "Spec Preview"}
            </DialogTitle>
            <DialogDescription className="text-copy-muted">
              {selectedSpec ? formatSpecTimestamp(selectedSpec.createdAt) : "Preview"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] px-6 py-5">
            {isPreviewLoading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-copy-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-ai-text" />
                  Loading preview...
                </div>
              </div>
            ) : previewError ? (
              <div className="rounded-2xl border border-state-error/40 bg-state-error/10 px-4 py-3 text-sm text-copy-primary">
                {previewError}
              </div>
            ) : previewContent ? (
              <div className="space-y-4">
                <ReactMarkdown components={markdownComponents}>
                  {previewContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="rounded-2xl border border-surface-border bg-elevated px-4 py-3 text-sm text-copy-muted">
                This spec has no previewable content.
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between gap-3 border-t border-surface-border/80 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => handlePreviewOpenChange(false)}
              className="rounded-xl border-surface-border bg-base/30 text-copy-primary hover:bg-subtle"
            >
              Close
            </Button>
            {selectedSpec ? (
              <a
                href={selectedSpec.downloadPath}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-xl bg-state-success text-primary-foreground hover:bg-state-success/90"
                )}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {activeRun ? (
        <SpecRunTracker
          runId={activeRun.runId}
          publicToken={activeRun.publicToken}
          onComplete={(run) => {
            void handleRunComplete(run)
          }}
          onError={handleRunError}
        />
      ) : null}
    </>
  )
}
