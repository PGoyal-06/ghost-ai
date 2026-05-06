"use client";

import { useCallback } from "react";
import { ReactFlow, Background, MiniMap, ConnectionMode, useReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react";

import { CanvasNodeComponent } from "./canvas-node";
import { ShapePanel } from "./shape-panel";
import { DEFAULT_NODE_COLOR, type CanvasNode, type CanvasEdge, type NodeShape } from "@/types/canvas";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";

/* ------------------------------------------------------------------ */
/*  Inner canvas — lives inside the Liveblocks room                   */
/* ------------------------------------------------------------------ */

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

let nodeCounter = 0;

function CollaborativeCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: [] },
      edges: { initial: [] },
      suspense: true,
    });

  const { screenToFlowPosition } = useReactFlow();

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
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
      >
        <Cursors />
        <Background />
        <MiniMap
          pannable
          zoomable
          style={{
            backgroundColor: "var(--bg-elevated)",
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
      <ShapePanel />
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
}

export function CanvasWrapper({ roomId }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <ClientSideSuspense fallback={<CanvasLoading />}>
          <ErrorBoundary fallback={<CanvasError />}>
            <ReactFlowProvider>
              <CollaborativeCanvas />
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
