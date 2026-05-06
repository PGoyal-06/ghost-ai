"use client";

import { useCallback } from "react";
import { ReactFlow, Background, ConnectionMode, useReactFlow, ReactFlowProvider, MarkerType, type Edge, type Connection } from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
} from "@liveblocks/react";
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

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

interface CollaborativeCanvasProps {
  isTemplatesModalOpen?: boolean;
  onCloseTemplatesModal?: () => void;
}

function CollaborativeCanvas({ isTemplatesModalOpen = false, onCloseTemplatesModal }: CollaborativeCanvasProps) {
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
      const updatedEdge: CanvasEdge = {
        ...(oldEdge as CanvasEdge),
        id: `edge-${Date.now()}`,
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
        fitView
      >
        <Cursors />
        <Background />
      </ReactFlow>
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
  isTemplatesModalOpen?: boolean;
  onCloseTemplatesModal?: () => void;
}

export function CanvasWrapper({ roomId, isTemplatesModalOpen, onCloseTemplatesModal }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <ClientSideSuspense fallback={<CanvasLoading />}>
          <ErrorBoundary fallback={<CanvasError />}>
            <ReactFlowProvider>
              <CollaborativeCanvas
                isTemplatesModalOpen={isTemplatesModalOpen}
                onCloseTemplatesModal={onCloseTemplatesModal}
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
