"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { ReactFlow, Background, ConnectionMode, useReactFlow, ReactFlowProvider, MarkerType, type Edge, type Connection } from "@xyflow/react";
import { useLiveblocksFlow, Cursors, type CursorsCursorProps } from "@liveblocks/react-flow";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useOthers,
  useOther,
} from "@liveblocks/react";
import { UserButton } from "@clerk/nextjs";
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Cloud, CloudOff, Loader2, Check } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutosave, type SaveStatus } from "@/hooks/useCanvasAutosave";

import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { DEFAULT_NODE_COLOR, type CanvasNode, type CanvasEdge, type NodeShape } from "@/types/canvas";
import type { CanvasTemplate } from "./starter-templates";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";

/* ------------------------------------------------------------------ */
/*  Inner canvas — lives inside the Liveblocks room                   */
/* ------------------------------------------------------------------ */

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

const edgeTypes = {
  canvasEdge: CanvasEdgeComponent,
};

let nodeCounter = 0;

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function CanvasCursor({ connectionId }: CursorsCursorProps) {
  const info = useOther(connectionId, (u) => u.info);
  if (!info) return null;

  return (
    <div className="pointer-events-none select-none inline-flex flex-col items-start">
      <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
        <path
          d="M0 0L0 13L3.5 9.5L6.5 15L8.5 14L5.5 8.5L11 8.5Z"
          fill={info.cursorColor}
          stroke="white"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="mt-1 rounded px-1.5 py-0.5 text-xs font-semibold text-white whitespace-nowrap"
        style={{ backgroundColor: info.cursorColor }}
      >
        {info.name}
      </div>
    </div>
  );
}

function PresenceAvatars() {
  const others = useOthers();
  const visible = others.slice(0, 5);
  const overflow = Math.max(0, others.length - 5);

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
      {others.length > 0 && (
        <>
          <div className="flex items-center">
            {visible.map((user, i) => (
              <div
                key={user.connectionId}
                className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#080809] text-xs font-semibold text-white"
                style={{
                  backgroundColor: user.info?.cursorColor ?? "#6366f1",
                  marginLeft: i > 0 ? "-8px" : undefined,
                  zIndex: visible.length - i,
                }}
                title={user.info?.name}
              >
                {user.info?.avatar ? (
                  <img
                    src={user.info.avatar}
                    alt={user.info.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user.info?.name ?? "")
                )}
              </div>
            ))}
            {overflow > 0 && (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-[#080809] bg-elevated text-xs font-semibold text-copy-secondary"
                style={{ marginLeft: "-8px" }}
              >
                +{overflow}
              </div>
            )}
          </div>
          <div className="h-5 w-px bg-surface-border" />
        </>
      )}
      <UserButton />
    </div>
  );
}

function ControlBar() {
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-6 left-6 z-10 flex items-center gap-1 rounded-full border border-surface-border bg-surface px-3 py-2 shadow-lg">
      <button
        onClick={() => zoomOut({ duration: 200 })}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-hover active:bg-surface-active"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4 text-copy" />
      </button>
      <button
        onClick={() => fitView({ duration: 200 })}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-hover active:bg-surface-active"
        title="Fit view"
      >
        <Maximize2 className="h-4 w-4 text-copy" />
      </button>
      <button
        onClick={() => zoomIn({ duration: 200 })}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-hover active:bg-surface-active"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4 text-copy" />
      </button>

      <div className="mx-1 h-5 w-px bg-surface-border" />

      <button
        onClick={undo}
        disabled={!canUndo}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-hover active:bg-surface-active disabled:cursor-not-allowed disabled:opacity-40"
        title="Undo"
      >
        <Undo2 className="h-4 w-4 text-copy" />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-hover active:bg-surface-active disabled:cursor-not-allowed disabled:opacity-40"
        title="Redo"
      >
        <Redo2 className="h-4 w-4 text-copy" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Save status indicator                                              */
/* ------------------------------------------------------------------ */

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 shadow-sm">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-copy-muted" />
          <span className="text-xs text-copy-muted">Saving…</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-state-success" />
          <span className="text-xs text-copy-muted">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="h-3 w-3 text-state-error" />
          <span className="text-xs text-state-error">Save failed</span>
        </>
      )}
      {status === "idle" && (
        <>
          <Cloud className="h-3 w-3 text-copy-muted" />
          <span className="text-xs text-copy-muted">Ready</span>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collaborative canvas                                               */
/* ------------------------------------------------------------------ */

interface CollaborativeCanvasProps {
  projectId: string;
  isTemplatesModalOpen?: boolean;
  onCloseTemplatesModal?: () => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onManualSaveReady?: (save: () => void) => void;
}

function CollaborativeCanvas({ projectId, isTemplatesModalOpen = false, onCloseTemplatesModal, onSaveStatusChange, onManualSaveReady }: CollaborativeCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: [] },
      edges: { initial: [] },
      suspense: true,
    });

  const reactFlow = useReactFlow();
  const { screenToFlowPosition } = reactFlow;

  const undo = useUndo();
  const redo = useRedo();

  useKeyboardShortcuts(reactFlow, { undo, redo });

  // --- Autosave ---
  const { status: saveStatus, manualSave } = useCanvasAutosave(projectId, nodes, edges);

  // Report save status and manual save to parent
  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  useEffect(() => {
    onManualSaveReady?.(manualSave);
  }, [manualSave, onManualSaveReady]);

  // --- Load saved canvas if room is empty on mount ---
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // If the room already has content, skip loading
    if (nodes.length > 0 || edges.length > 0) return;

    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (!res.ok) return;
        const data = await res.json() as { nodes: CanvasNode[]; edges: CanvasEdge[] };
        if (!data.nodes?.length && !data.edges?.length) return;

        if (data.nodes.length > 0) {
          onNodesChange(data.nodes.map((n) => ({ type: "add" as const, item: n })));
        }
        if (data.edges.length > 0) {
          onEdgesChange(data.edges.map((e) => ({ type: "add" as const, item: e })));
        }
        setTimeout(() => reactFlow.fitView({ duration: 300 }), 100);
      } catch {
        // Silently fail — user can still use the canvas
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importTemplate = useCallback(
    (template: CanvasTemplate) => {
      onNodesChange([
        ...nodes.map((n) => ({ type: "remove" as const, id: n.id })),
        ...template.nodes.map((n) => ({ type: "add" as const, item: n })),
      ]);
      onEdgesChange([
        ...edges.map((e) => ({ type: "remove" as const, id: e.id })),
        ...template.edges.map((e) => ({ type: "add" as const, item: e })),
      ]);
      setTimeout(() => reactFlow.fitView({ duration: 300 }), 50);
    },
    [nodes, edges, onNodesChange, onEdgesChange, reactFlow],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const payloadStr = event.dataTransfer.getData(
        "application/vnd.ghost-ai.shape"
      );
      if (!payloadStr) return;

      try {
        const payload = JSON.parse(payloadStr) as {
          shape: NodeShape;
          width: number;
          height: number;
        };

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Center the node on the cursor position
        position.x -= payload.width / 2;
        position.y -= payload.height / 2;

        const newNode: CanvasNode = {
          id: `${payload.shape}-${Date.now()}-${nodeCounter++}`,
          type: "canvasNode",
          position,
          data: {
            label: "",
            color: DEFAULT_NODE_COLOR.fill,
            shape: payload.shape,
          },
          style: {
            width: payload.width,
            height: payload.height,
          },
        };

        onNodesChange([{ type: "add", item: newNode }]);
      } catch (err) {
        console.error("Failed to parse dropped shape", err);
      }
    },
    [screenToFlowPosition, onNodesChange]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!newConnection.source || !newConnection.target) return;
      const updatedEdge: CanvasEdge = {
        ...(oldEdge as CanvasEdge),
        id: oldEdge.id,
        source: newConnection.source,
        target: newConnection.target,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle,
      };

      onEdgesChange([
        { type: "remove", id: oldEdge.id },
        { type: "add", item: updatedEdge },
      ]);
    },
    [onEdgesChange]
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "canvasEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
        connectionMode={ConnectionMode.Loose}
        edgesReconnectable={true}
        onReconnect={onEdgeUpdate}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <Cursors components={{ Cursor: CanvasCursor }} />
        <Background />
      </ReactFlow>
      <PresenceAvatars />
      <SaveStatusIndicator status={saveStatus} />
      <ControlBar />
      <ShapePanel />
      <StarterTemplatesModal
        open={isTemplatesModalOpen}
        onClose={() => onCloseTemplatesModal?.()}
        onImport={importTemplate}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading fallback                                                   */
/* ------------------------------------------------------------------ */

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-copy-muted border-t-brand" />
        <p className="text-xs font-medium text-copy-muted">
          Connecting to canvas&hellip;
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error fallback                                                     */
/* ------------------------------------------------------------------ */

function CanvasError() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-sm rounded-2xl border border-surface-border bg-surface px-6 py-8 text-center">
        <p className="text-sm font-semibold text-state-error">
          Connection failed
        </p>
        <p className="mt-2 text-xs leading-relaxed text-copy-muted">
          Could not connect to the real-time canvas. Check your network or
          refresh the page.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public wrapper — sets up Liveblocks room for the canvas            */
/* ------------------------------------------------------------------ */

interface CanvasWrapperProps {
  roomId: string;
  projectId: string;
  isTemplatesModalOpen?: boolean;
  onCloseTemplatesModal?: () => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onManualSaveReady?: (save: () => void) => void;
}

export function CanvasWrapper({ roomId, projectId, isTemplatesModalOpen, onCloseTemplatesModal, onSaveStatusChange, onManualSaveReady }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={16}>
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <ClientSideSuspense fallback={<CanvasLoading />}>
          <ErrorBoundary fallback={<CanvasError />}>
            <ReactFlowProvider>
              <CollaborativeCanvas
                projectId={projectId}
                isTemplatesModalOpen={isTemplatesModalOpen}
                onCloseTemplatesModal={onCloseTemplatesModal}
                onSaveStatusChange={onSaveStatusChange}
                onManualSaveReady={onManualSaveReady}
              />
            </ReactFlowProvider>
          </ErrorBoundary>
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Minimal error boundary for Liveblocks connection issues            */
/* ------------------------------------------------------------------ */

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
