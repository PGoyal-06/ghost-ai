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
  };

  return (
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
  );
}
