"use client"

import { useEffect, useRef, useState } from "react"
import type { AnyTask, RealtimeRun } from "@trigger.dev/core/v3"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react"
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useFeeds,
  useSelf,
} from "@liveblocks/react"
import { Button } from "@/components/ui/button"
import { ProjectSpecsPanel } from "@/components/editor/project-specs-panel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AI_CHAT_FEED_ID,
  AI_CHAT_FEED_METADATA,
  AI_STATUS_FEED_ID,
  AI_STATUS_FEED_METADATA,
  aiChatMessageSchema,
  aiStatusMessageSchema,
  type AiChatMessage,
  type AiStatusMessage,
} from "@/types/tasks"
import type { CanvasSnapshot } from "@/types/canvas"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  getCanvasSnapshot?: () => CanvasSnapshot
}

interface FeedMessageCandidate {
  id: string
  createdAt: number
  data: unknown
}

interface ActiveDesignRun {
  runId: string
  publicToken: string
}

interface DesignRunResponse {
  runId: string
  publicToken: string
}

interface AiRunTrackerProps {
  runId: string
  publicToken: string
  onComplete: (run: RealtimeRun<AnyTask>) => void
  onError: (error: Error) => void
}

function getLatestValidStatusMessage(
  messages: readonly FeedMessageCandidate[] | undefined
): AiStatusMessage | null {
  if (!messages) {
    return null
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const parsed = aiStatusMessageSchema.safeParse(messages[index]?.data)

    if (parsed.success) {
      return parsed.data
    }
  }

  return null
}

function getValidChatMessages(
  messages: readonly FeedMessageCandidate[] | undefined
): Array<{
  id: string
  createdAt: number
  data: AiChatMessage
}> {
  if (!messages) {
    return []
  }

  return messages
    .flatMap((message) => {
      const parsed = aiChatMessageSchema.safeParse(message.data)

      if (!parsed.success) {
        return []
      }

      return [
        {
          id: message.id,
          createdAt: message.createdAt,
          data: parsed.data,
        },
      ]
    })
    .sort((messageA, messageB) => messageA.createdAt - messageB.createdAt)
}

function isFeedAlreadyCreatedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 409
  )
}

function getStatusHeading(message: AiStatusMessage): string {
  switch (message.status) {
    case "start":
      return "Ghost AI started working"
    case "processing":
      return "Ghost AI is updating the room"
    case "complete":
      return "Ghost AI finished"
    case "error":
      return "Ghost AI stopped with an error"
  }
}

function formatMessageTimestamp(timestamp: string): string {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function getRunCompletionMessage(
  run: RealtimeRun<AnyTask>,
  latestStatusMessage: AiStatusMessage | null
) {
  if (run.status === "COMPLETED") {
    return latestStatusMessage?.text || "I finished updating the canvas."
  }

  return (
    latestStatusMessage?.text ||
    "I couldn't finish the canvas update. Please try again."
  )
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

function parseDesignRunResponse(payload: unknown): DesignRunResponse | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "runId" in payload &&
    typeof payload.runId === "string" &&
    payload.runId.trim() &&
    "publicToken" in payload &&
    typeof payload.publicToken === "string" &&
    payload.publicToken.trim()
  ) {
    return {
      runId: payload.runId,
      publicToken: payload.publicToken,
    }
  }

  return null
}

function AiRunTracker({
  runId,
  publicToken,
  onComplete,
  onError,
}: AiRunTrackerProps) {
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
  }, [runId, publicToken])

  useEffect(() => {
    if (!error || handledErrorRef.current) {
      return
    }

    handledErrorRef.current = true
    onError(error)
  }, [error, onError])

  return null
}

export function AiSidebar({
  isOpen,
  onClose,
  projectId,
  getCanvasSnapshot,
}: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState<"architect" | "specs">("architect")
  const [input, setInput] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [activeRun, setActiveRun] = useState<ActiveDesignRun | null>(null)
  const self = useSelf()
  const { feeds, isLoading: isFeedsLoading } = useFeeds()
  const { messages: chatMessages } = useFeedMessages(AI_CHAT_FEED_ID)
  const { messages: statusMessages } = useFeedMessages(AI_STATUS_FEED_ID)
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const attemptedFeedCreationRef = useRef(new Set<string>())

  const starterChips = [
    "Design an e-commerce backend",
    "Create a chat app architecture",
    "Build a CI/CD pipeline",
  ]

  const currentUserName = self?.info?.name?.trim() || "Anonymous collaborator"
  const hasChatFeed = feeds?.some((feed) => feed.feedId === AI_CHAT_FEED_ID) ?? false
  const hasStatusFeed =
    feeds?.some((feed) => feed.feedId === AI_STATUS_FEED_ID) ?? false

  const ensureFeedExists = async (
    feedId: string,
    metadata: typeof AI_CHAT_FEED_METADATA | typeof AI_STATUS_FEED_METADATA
  ) => {
    if (feeds?.some((feed) => feed.feedId === feedId)) {
      return
    }

    try {
      await createFeed(feedId, { metadata })
    } catch (error) {
      if (!isFeedAlreadyCreatedError(error)) {
        throw error
      }
    }
  }

  useEffect(() => {
    if (isFeedsLoading) {
      return
    }

    const feedDefinitions = [
      {
        feedId: AI_CHAT_FEED_ID,
        hasFeed: hasChatFeed,
        metadata: AI_CHAT_FEED_METADATA,
      },
      {
        feedId: AI_STATUS_FEED_ID,
        hasFeed: hasStatusFeed,
        metadata: AI_STATUS_FEED_METADATA,
      },
    ] as const

    for (const { feedId, hasFeed, metadata } of feedDefinitions) {
      if (hasFeed || attemptedFeedCreationRef.current.has(feedId)) {
        continue
      }

      attemptedFeedCreationRef.current.add(feedId)

      void createFeed(feedId, { metadata }).catch((error) => {
        if (isFeedAlreadyCreatedError(error)) {
          return
        }

        attemptedFeedCreationRef.current.delete(feedId)
      })
    }
  }, [createFeed, hasChatFeed, hasStatusFeed, isFeedsLoading])

  const validChatMessages = getValidChatMessages(chatMessages)
  const latestStatusMessage = getLatestValidStatusMessage(statusMessages)
  const isAiWorking = activeRun !== null
  const trimmedInput = input.trim()

  const publishChatMessage = async (message: AiChatMessage) => {
    if (!hasChatFeed) {
      await ensureFeedExists(AI_CHAT_FEED_ID, AI_CHAT_FEED_METADATA)
    }

    await createFeedMessage(AI_CHAT_FEED_ID, aiChatMessageSchema.parse(message))
  }

  const publishSystemErrorMessage = async (content: string) => {
    await publishChatMessage({
      sender: "Ghost AI",
      role: "system",
      content,
      timestamp: new Date().toISOString(),
    })
  }

  const handleRunError = async (error: Error | string) => {
    setActiveRun(null)

    const message =
      typeof error === "string"
        ? error
        : error.message || "Ghost AI couldn't start or finish the design run."

    try {
      await publishSystemErrorMessage(message)
      setSendError(null)
    } catch {
      setSendError(message)
    }
  }

  const handleRunComplete = async (run: RealtimeRun<AnyTask>) => {
    setActiveRun(null)

    try {
      await publishChatMessage({
        sender: "Ghost AI",
        role: run.status === "COMPLETED" ? "assistant" : "system",
        content: getRunCompletionMessage(run, latestStatusMessage),
        timestamp: new Date().toISOString(),
      })
      setSendError(null)
    } catch {
      setSendError("Ghost AI finished, but the final chat update failed to send.")
    }
  }

  const triggerDesignRun = async (prompt: string) => {
    const response = await fetch("/api/ai/design", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        roomId: projectId,
      }),
    })

    const payload = (await response.json().catch(() => null)) as unknown

    if (!response.ok) {
      throw new Error(
        getResponseError(payload) || "Ghost AI couldn't start the design run."
      )
    }

    const runResponse = parseDesignRunResponse(payload)

    if (!runResponse) {
      throw new Error("Ghost AI returned an invalid run response.")
    }

    return runResponse
  }

  const handleSubmit = async () => {
    if (!trimmedInput || isAiWorking || isSending) {
      return
    }

    setSendError(null)
    setIsSending(true)

    try {
      const message = aiChatMessageSchema.parse({
        sender: currentUserName,
        role: "user",
        content: trimmedInput,
        timestamp: new Date().toISOString(),
      })

      await publishChatMessage(message)
      setInput("")

      const run = await triggerDesignRun(message.content)
      setActiveRun(run)
    } catch (error) {
      await handleRunError(
        error instanceof Error
          ? error.message
          : "Ghost AI couldn't start the design run. Try again."
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <aside
      className={cn(
        "fixed bottom-4 left-4 right-4 top-16 z-40 flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface/92 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-in-out md:left-auto md:max-w-[23.5rem]",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--color-subtle),transparent_38%)] opacity-50" />

      <div className="relative flex items-center justify-between border-b border-surface-border/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ai/15 text-ai-text">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-copy-primary">AI Workspace</h2>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close AI sidebar"
          onClick={onClose}
          className="rounded-full text-copy-muted hover:bg-subtle/80 hover:text-copy-primary"
        >
          <X size={18} />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "architect" || value === "specs") {
            setActiveTab(value)
          }
        }}
        className="relative flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-5 pt-4">
          <TabsList className="h-10 rounded-2xl border border-surface-border/70 bg-subtle/70 p-1">
            <TabsTrigger
              value="architect"
              className="rounded-xl px-4 text-xs font-medium text-copy-muted data-active:bg-ai data-active:text-copy-primary"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-xl px-4 text-xs font-medium text-copy-muted data-active:bg-base data-active:text-copy-primary"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="mt-0 flex flex-1 flex-col overflow-hidden outline-none"
        >
          <ScrollArea className="flex-1 px-5 py-4">
            {validChatMessages.length > 0 ? (
              <div className="flex min-h-full flex-col gap-3 py-4">
                {validChatMessages.map((message) => {
                  const isUserMessage = message.data.role === "user"
                  const isCurrentUserMessage =
                    isUserMessage && message.data.sender === currentUserName

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isCurrentUserMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[300px] rounded-2xl border px-4 py-3 text-sm",
                          isUserMessage
                            ? "border-state-success/35 bg-state-success/20 text-primary-foreground"
                            : "border-surface-border bg-base/60 text-copy-primary"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-4 text-[11px]">
                          <span
                            className={cn(
                              "font-medium",
                              isUserMessage
                                ? "text-primary-foreground/80"
                                : "text-copy-primary"
                            )}
                          >
                            {message.data.sender}
                          </span>
                          <time
                            dateTime={message.data.timestamp}
                            className={cn(
                              "shrink-0",
                              isUserMessage
                                ? "text-primary-foreground/65"
                                : "text-copy-faint"
                            )}
                          >
                            {formatMessageTimestamp(message.data.timestamp)}
                          </time>
                        </div>
                        <p
                          className={cn(
                            "whitespace-pre-wrap leading-relaxed",
                            isUserMessage
                              ? "text-primary-foreground"
                              : "text-copy-secondary"
                          )}
                        >
                          {message.data.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ai/15 text-ai-text shadow-inner">
                  <Bot size={24} />
                </div>
                <h3 className="mb-2 text-2xl font-semibold text-copy-primary">Ghost AI Architect</h3>
                <p className="mb-8 max-w-[270px] text-sm leading-7 text-copy-muted">
                  Describe your system and I&apos;ll help you design the architecture.
                </p>

                <div className="flex w-full max-w-[300px] flex-col gap-2">
                  {starterChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInput(chip)}
                      disabled={isAiWorking}
                      className="rounded-2xl border border-transparent bg-subtle/80 px-4 py-3 text-left text-sm text-ai-text transition-colors hover:border-surface-border hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-surface-border/80 p-4">
            <div className="rounded-[1.75rem] border border-surface-border/80 bg-elevated/70 p-3">
              {isAiWorking ? (
                <div
                  className={cn(
                    "mb-3 flex items-start gap-2 rounded-2xl border px-3 py-2 text-xs",
                    latestStatusMessage?.status === "error"
                      ? "border-state-error/40 bg-state-error/10 text-copy-primary"
                      : "border-state-success/35 bg-base text-copy-primary"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center",
                      latestStatusMessage?.status === "error"
                        ? "text-state-error"
                        : "text-state-success"
                    )}
                  >
                    {latestStatusMessage?.status === "error" ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-copy-primary">
                      {latestStatusMessage
                        ? getStatusHeading(latestStatusMessage)
                        : "Ghost AI is updating the room"}
                    </p>
                    {latestStatusMessage?.text ? (
                      <p className="mt-1 leading-relaxed text-copy-muted">
                        {latestStatusMessage.text}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {sendError ? (
                <p className="mb-3 rounded-2xl border border-state-error/40 bg-state-error/10 px-3 py-2 text-xs text-copy-primary">
                  {sendError}
                </p>
              ) : null}

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your system..."
                disabled={isAiWorking || isSending}
                className="min-h-[108px] max-h-[180px] resize-none border-0 bg-transparent px-0 py-0 text-sm text-copy-primary shadow-none placeholder:text-copy-muted focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSubmit()
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-copy-faint">
                  {isAiWorking
                    ? "Ghost AI is currently working in this room."
                    : isSending
                      ? "Sending message..."
                      : "Shift+Enter for newline"}
                </p>
                <Button
                  size="sm"
                  aria-label={
                    isAiWorking
                      ? "AI generation in progress"
                      : isSending
                        ? "Sending message"
                        : "Send message"
                  }
                  onClick={() => {
                    void handleSubmit()
                  }}
                  disabled={!trimmedInput || isAiWorking || isSending}
                  className={cn(
                    "rounded-xl px-3 text-primary-foreground",
                    !trimmedInput || isAiWorking || isSending
                      ? "bg-state-success/50 hover:bg-state-success/50"
                      : "bg-state-success hover:bg-state-success/90"
                  )}
                >
                  {isAiWorking || isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {isAiWorking ? "Working" : "Sending"}
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="specs"
          className="mt-0 flex flex-1 flex-col overflow-hidden outline-none"
        >
          <ProjectSpecsPanel
            projectId={projectId}
            isActive={activeTab === "specs"}
            chatHistory={validChatMessages.map((message) => message.data)}
            getCanvasSnapshot={getCanvasSnapshot}
          />
        </TabsContent>
      </Tabs>

      {activeRun ? (
        <AiRunTracker
          runId={activeRun.runId}
          publicToken={activeRun.publicToken}
          onComplete={(run) => {
            void handleRunComplete(run)
          }}
          onError={(error) => {
            void handleRunError(error)
          }}
        />
      ) : null}
    </aside>
  )
}
