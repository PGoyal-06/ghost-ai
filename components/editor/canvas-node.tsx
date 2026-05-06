"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center rounded border-2 shadow-sm ${
        selected
          ? "border-brand ring-2 ring-brand/20"
          : "border-surface-border"
      }`}
      style={{ backgroundColor: data.color }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2 w-2 !border-surface-border !bg-surface"
      />
      <span className="text-sm font-medium text-copy">
        {data.label || data.shape}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2 w-2 !border-surface-border !bg-surface"
      />
    </div>
  );
}
