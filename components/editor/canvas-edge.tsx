"use client";

import { useState, useRef, useEffect } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { type CanvasEdge } from "@/types/canvas";

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const { updateEdgeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const label = data?.label || "";

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const onLabelChange = (newLabel: string) => {
    updateEdgeData(id, { label: newLabel });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" || e.key === "Enter") {
      e.preventDefault();
      setIsEditing(false);
      textareaRef.current?.blur();
    }
  };

  // Prevent drag/pan when interacting with label
  const onLabelPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Invisible thicker path for easier hovering/clicking */}
      <path
        d={edgePath}
        className="peer cursor-pointer stroke-transparent"
        style={{ strokeWidth: 20, fill: "none" }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      />
      {/* Visual path */}
      <path
        id={id}
        className={`react-flow__edge-path pointer-events-none transition-all duration-200 ${
          selected
            ? "stroke-brand"
            : "stroke-surface-border/60 peer-hover:stroke-surface-border"
        }`}
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 2,
          strokeLinecap: "round",
          fill: "none",
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={() => setIsEditing(true)}
          onPointerDown={onLabelPointerDown}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={label}
              onChange={(e) => {
                onLabelChange(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onBlur={() => setIsEditing(false)}
              onKeyDown={handleKeyDown}
              placeholder="Label..."
              className="resize-none overflow-hidden rounded-full border border-surface-border bg-surface px-3 py-1 text-xs font-medium leading-snug text-copy outline-none ring-2 ring-brand/20 backdrop-blur-md"
              rows={1}
              style={{
                width: Math.max(80, label.length * 8 + 32) + "px",
              }}
            />
          ) : label ? (
            <div className="cursor-text select-none rounded-full border border-surface-border bg-surface px-3 py-1 text-xs font-medium text-copy shadow-sm transition-colors hover:border-brand">
              {label}
            </div>
          ) : selected ? (
            <div className="cursor-text select-none rounded-full bg-surface/50 px-2 py-0.5 text-[10px] font-medium text-copy-muted/50 backdrop-blur-sm">
              Add label
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
