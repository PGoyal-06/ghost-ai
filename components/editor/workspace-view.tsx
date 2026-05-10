"use client";

import { useState, useCallback, useRef } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { EditorShell } from "./editor-shell";
import { CanvasWrapper } from "./canvas-wrapper";
import type { SaveStatus } from "@/hooks/useCanvasAutosave";
import type { CanvasSnapshot } from "@/types/canvas";

interface WorkspaceViewProps {
  projectId: string;
  projectName: string;
  isProjectOwner: boolean;
}

export function WorkspaceView({ projectId, projectName, isProjectOwner }: WorkspaceViewProps) {
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const canvasSnapshotRef = useRef<(() => CanvasSnapshot) | null>(null);
  const manualSaveRef = useRef<(() => void) | null>(null);

  const handleManualSaveReady = useCallback((save: () => void) => {
    manualSaveRef.current = save;
  }, []);

  const handleManualSave = useCallback(() => {
    manualSaveRef.current?.();
  }, []);

  const handleCanvasSnapshotReady = useCallback((getSnapshot: () => CanvasSnapshot) => {
    canvasSnapshotRef.current = getSnapshot;
  }, []);

  const handleGetCanvasSnapshot = useCallback((): CanvasSnapshot => {
    return canvasSnapshotRef.current?.() ?? {
      nodes: [],
      edges: [],
    };
  }, []);

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={16}>
      <RoomProvider
        id={projectId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <ClientSideSuspense fallback={null}>
          <EditorShell
            projectId={projectId}
            projectName={projectName}
            isProjectOwner={isProjectOwner}
            onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
            saveStatus={saveStatus}
            onManualSave={handleManualSave}
            getCanvasSnapshot={handleGetCanvasSnapshot}
          >
            <CanvasWrapper
              projectId={projectId}
              isTemplatesModalOpen={isTemplatesModalOpen}
              onCloseTemplatesModal={() => setIsTemplatesModalOpen(false)}
              onSaveStatusChange={setSaveStatus}
              onManualSaveReady={handleManualSaveReady}
              onCanvasSnapshotReady={handleCanvasSnapshotReady}
            />
          </EditorShell>
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
