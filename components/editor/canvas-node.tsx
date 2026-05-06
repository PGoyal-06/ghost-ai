"use client";

import {
  Handle,
  Position,
  NodeResizer,
  NodeToolbar,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import { type CanvasNode, NODE_COLORS } from "@/types/canvas";
import { NodeShapeRenderer } from "./node-shape";

export function CanvasNodeComponent({
  id,
  data,
  selected,
}: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div className="group relative h-full w-full">
      <NodeResizer
        color="var(--brand)"
        isVisible={selected}
        minWidth={80}
        minHeight={80}
        handleClassName="h-2 w-2 !border-surface-border !bg-surface"
      />

      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="nodrag nopan flex items-center gap-1.5 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-xl backdrop-blur-md"
      >
        {NODE_COLORS.map((colorPair) => (
          <button
            key={colorPair.fill}
            type="button"
            aria-label={`Set node color: ${colorPair.character}`}
            className="h-6 w-6 rounded-full border border-surface-border transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
            style={{
              backgroundColor: colorPair.fill,
              boxShadow:
                data.color === colorPair.fill
                  ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${colorPair.text}`
                  : undefined,
              ...(data.color !== colorPair.fill &&
                ({
                  // Add a hover glow variable, will rely on Tailwind arbitrary values via inline style or class
                  "--hover-glow": colorPair.text,
                } as React.CSSProperties)),
            }}
            onMouseEnter={(e) => {
              if (data.color !== colorPair.fill) {
                e.currentTarget.style.boxShadow = `0 0 8px 1px ${colorPair.text}80`;
              }
            }}
            onMouseLeave={(e) => {
              if (data.color !== colorPair.fill) {
                e.currentTarget.style.boxShadow = "";
              }
            }}
            onClick={() => updateNodeData(id, { color: colorPair.fill })}
            title={colorPair.character}
          />
        ))}
      </NodeToolbar>

      <NodeShapeRenderer
        shape={data.shape}
        color={data.color}
        selected={selected}
        label={data.label}
        onLabelChange={(newLabel) => updateNodeData(id, { label: newLabel })}
      />
      <Handle
        type="source"
        id="top"
        position={Position.Top}
        className="h-2 w-2 !border-surface-border !bg-white opacity-0 transition-opacity group-hover:opacity-100"
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="h-2 w-2 !border-surface-border !bg-white opacity-0 transition-opacity group-hover:opacity-100"
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="h-2 w-2 !border-surface-border !bg-white opacity-0 transition-opacity group-hover:opacity-100"
      />
      <Handle
        type="source"
        id="left"
        position={Position.Left}
        className="h-2 w-2 !border-surface-border !bg-white opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}
