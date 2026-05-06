"use client";

import { useState } from "react";
import { EditorShell } from "./editor-shell";
import { CanvasWrapper } from "./canvas-wrapper";

interface WorkspaceViewProps {
  projectId: string;
  projectName: string;
  isProjectOwner: boolean;
}

export function WorkspaceView({ projectId, projectName, isProjectOwner }: WorkspaceViewProps) {
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  return (
    <EditorShell
      projectId={projectId}
      projectName={projectName}
      isProjectOwner={isProjectOwner}
      onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
    >
      <CanvasWrapper
        roomId={projectId}
        isTemplatesModalOpen={isTemplatesModalOpen}
        onCloseTemplatesModal={() => setIsTemplatesModalOpen(false)}
      />
    </EditorShell>
  );
}
