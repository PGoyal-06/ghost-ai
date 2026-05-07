import { useEffect, useRef, useCallback, useState } from "react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

const DEBOUNCE_MS = 2000

export function useCanvasAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastSavedRef = useRef<string>("")

  const save = useCallback(
    async (n: CanvasNode[], e: CanvasEdge[]) => {
      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const payload = JSON.stringify({ nodes: n, edges: e })

      // Skip if nothing changed since last save
      if (payload === lastSavedRef.current) return

      setStatus("saving")
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
        })

        if (!res.ok) throw new Error("Save failed")
        lastSavedRef.current = payload
        setStatus("saved")
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setStatus("error")
      }
    },
    [projectId]
  )

  // Debounced save whenever nodes/edges change
  useEffect(() => {
    // Don't save empty canvases on initial mount
    if (nodes.length === 0 && edges.length === 0) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      save(nodes, edges)
    }, DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [nodes, edges, save])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const manualSave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    save(nodes, edges)
  }, [nodes, edges, save])

  return { status, manualSave }
}
