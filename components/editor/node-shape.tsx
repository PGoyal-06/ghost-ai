"use client";

import { useState, useRef, useEffect } from "react";
import type { NodeShape } from "@/types/canvas";

interface NodeShapeRendererProps {
  shape: NodeShape;
  color: string;
  selected?: boolean;
  label?: string;
  onLabelChange?: (newLabel: string) => void;
  className?: string;
}

export function NodeShapeRenderer({
  shape,
  color,
  selected,
  label = "",
  onLabelChange,
  className = "",
}: NodeShapeRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleDoubleClick = () => {
    if (onLabelChange) setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      textareaRef.current?.blur();
    }
  };

  const renderLabelContent = (isSvg: boolean = false) => {
    const pxClass = isSvg ? "px-6" : "px-4";

    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={label}
          onChange={(e) => {
            onLabelChange?.(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
          placeholder="Type something..."
          className={`nodrag nopan w-full resize-none overflow-hidden bg-transparent ${pxClass} text-center text-sm font-medium leading-snug text-copy outline-none placeholder:text-copy-muted/50`}
          rows={1}
        />
      );
    }

    return (
      <div
        onDoubleClick={handleDoubleClick}
        className={`line-clamp-3 w-full cursor-text select-none ${pxClass} text-center text-sm font-medium leading-snug text-copy`}
      >
        {label || <span className="text-copy-muted/50">Type something...</span>}
      </div>
    );
  };

  const baseClasses =
    "absolute inset-0 flex h-full w-full items-center justify-center transition-colors";

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    let radiusClass = "rounded";
    if (shape === "pill") radiusClass = "rounded-full";
    if (shape === "circle") radiusClass = "rounded-full";

    return (
      <div
        className={`${baseClasses} ${radiusClass} border-2 ${
          selected
            ? "border-brand ring-2 ring-brand/20"
            : "border-surface-border"
        } ${className}`}
        style={{ backgroundColor: color }}
      >
        {renderLabelContent(false)}
      </div>
    );
  }

  let svgContent = null;

  if (shape === "diamond") {
    svgContent = (
      <polygon
        points="50,0 100,50 50,100 0,50"
        vectorEffect="non-scaling-stroke"
      />
    );
  } else if (shape === "hexagon") {
    svgContent = (
      <polygon
        points="25,0 75,0 100,50 75,100 25,100 0,50"
        vectorEffect="non-scaling-stroke"
      />
    );
  } else if (shape === "cylinder") {
    svgContent = (
      <>
        <path
          d="M 0,15 L 0,85 A 50,15 0 0,0 100,85 L 100,15 Z"
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="50"
          cy="15"
          rx="50"
          ry="15"
          vectorEffect="non-scaling-stroke"
        />
      </>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        style={{
          fill: color,
          stroke: selected ? "var(--brand)" : "var(--border-default)",
          strokeWidth: 2,
        }}
      >
        {svgContent}
      </svg>
      {selected && (
        <div className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded ring-2 ring-brand/20" />
      )}
      <div className="relative z-10 flex w-full items-center justify-center">
        {renderLabelContent(true)}
      </div>
    </div>
  );
}
