"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

export function useKeyboardShortcuts(
  reactFlow: ReactFlowInstance | null,
  { undo, redo }: { undo: () => void; redo: () => void },
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
        ) {
          return;
        }

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (!ctrl && (e.key === "+" || e.key === "=")) {
        reactFlow?.zoomIn({ duration: 200 });
        return;
      }
      if (!ctrl && e.key === "-") {
        reactFlow?.zoomOut({ duration: 200 });
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reactFlow, undo, redo]);
}
