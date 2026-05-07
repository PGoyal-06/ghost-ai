"use client";

import { useState, useCallback, useRef } from "react";
import { EditorShell } from "./editor-shell";
import { CanvasWrapper } from "./canvas-wrapper";
import type { SaveStatus } from "@/hooks/useCanvasAutosave";

interface WorkspaceViewProps {
  projectId: string;
  projectName: string;
  isProjectOwner: boolean;
}

export function WorkspaceView({ projectId, projectName, isProjectOwner }: WorkspaceViewProps) {
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const manualSaveRef = useRef<(() => void) | null>(null);

  const handleManualSaveReady = useCallback((save: () => void) => {
    manualSaveRef.current = save;
  }, []);

  const handleManualSave = useCallback(() => {
    manualSaveRef.current?.();
  }, []);

  return (
    <EditorShell
      projectId={projectId}
      projectName={projectName}
      isProjectOwner={isProjectOwner}
      onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
      saveStatus={saveStatus}
      onManualSave={handleManualSave}
    >
      <CanvasWrapper
        roomId={projectId}
        projectId={projectId}
        isTemplatesModalOpen={isTemplatesModalOpen}
        onCloseTemplatesModal={() => setIsTemplatesModalOpen(false)}
        onSaveStatusChange={setSaveStatus}
        onManualSaveReady={handleManualSaveReady}
      />
    </EditorShell>
  );
}
