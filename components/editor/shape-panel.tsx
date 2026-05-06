"use client";

import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { NodeShape } from "@/types/canvas";
import { NodeShapeRenderer } from "./node-shape";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";

const SHAPES: {
  shape: NodeShape;
  icon: React.ElementType;
  width: number;
  height: number;
}[] = [
  { shape: "rectangle", icon: RectangleHorizontal, width: 150, height: 80 },
  { shape: "diamond", icon: Diamond, width: 120, height: 120 },
  { shape: "circle", icon: Circle, width: 100, height: 100 },
  { shape: "pill", icon: Pill, width: 150, height: 60 },
  { shape: "cylinder", icon: Cylinder, width: 100, height: 120 },
  { shape: "hexagon", icon: Hexagon, width: 120, height: 100 },
];

export function ShapePanel() {
  const onDragStart = (
    event: React.DragEvent,
    shapeData: { shape: NodeShape; width: number; height: number }
  ) => {
    event.dataTransfer.setData(
      "application/vnd.ghost-ai.shape",
      JSON.stringify(shapeData)
    );
    event.dataTransfer.effectAllowed = "copy";
    
    const previewEl = document.getElementById(`drag-preview-${shapeData.shape}`);
    if (previewEl) {
      // Center the preview cursor by providing half dimensions
      event.dataTransfer.setDragImage(previewEl, shapeData.width / 2, shapeData.height / 2);
    }
  };

  return (
    <>
      {/* Hidden drag previews */}
      <div className="pointer-events-none fixed left-0 top-0 -z-50 opacity-0" aria-hidden="true">
        {SHAPES.map(({ shape, width, height }) => (
          <div
            key={`preview-${shape}`}
            id={`drag-preview-${shape}`}
            style={{ width, height }}
            className="relative"
          >
            <NodeShapeRenderer shape={shape} color={DEFAULT_NODE_COLOR.fill} />
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-2 shadow-lg">
        {SHAPES.map(({ shape, icon: Icon, width, height }) => (
          <button
            key={shape}
            draggable
            onDragStart={(e) => onDragStart(e, { shape, width, height })}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-hover active:bg-surface-active"
            title={`Add ${shape}`}
          >
            <Icon className="h-5 w-5 text-copy" />
          </button>
        ))}
      </div>
    </>
  );
}

