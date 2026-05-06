"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { NODE_COLORS } from "@/types/canvas";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";
import type { CanvasNode } from "@/types/canvas";

/* ------------------------------------------------------------------ */
/*  SVG preview                                                        */
/* ------------------------------------------------------------------ */

const VIEW_W = 480;
const VIEW_H = 280;
const PAD = 28;

function nodeDims(n: CanvasNode) {
  return {
    w: (n.style?.width as number) ?? 120,
    h: (n.style?.height as number) ?? 60,
  };
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template;
  if (nodes.length === 0) {
    return (
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" style={{ background: "#0D0D0D", display: "block" }} />
    );
  }

  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxX = Math.max(...nodes.map((n) => n.position.x + nodeDims(n).w));
  const maxY = Math.max(...nodes.map((n) => n.position.y + nodeDims(n).h));

  const availW = VIEW_W - PAD * 2;
  const availH = VIEW_H - PAD * 2;
  
  const spanW = Math.max(1, maxX - minX);
  const spanH = Math.max(1, maxY - minY);
  const scale = Math.min(availW / spanW, availH / spanH);

  const tx = PAD + (availW - (maxX - minX) * scale) / 2 - minX * scale;
  const ty = PAD + (availH - (maxY - minY) * scale) / 2 - minY * scale;

  const center = (n: CanvasNode) => {
    const { w, h } = nodeDims(n);
    return {
      x: n.position.x * scale + tx + (w * scale) / 2,
      y: n.position.y * scale + ty + (h * scale) / 2,
    };
  };

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  function renderNode(n: CanvasNode) {
    const { w, h } = nodeDims(n);
    const x = n.position.x * scale + tx;
    const y = n.position.y * scale + ty;
    const sw = w * scale;
    const sh = h * scale;
    const cx = x + sw / 2;
    const cy = y + sh / 2;
    const fill =
      NODE_COLORS.find((c) => c.fill === n.data.color)?.fill ?? "#1F1F1F";

    switch (n.data.shape) {
      case "circle": {
        const r = Math.min(sw, sh) / 2;
        return <circle key={n.id} cx={cx} cy={cy} r={r} fill={fill} />;
      }
      case "diamond": {
        const pts = `${cx},${y} ${x + sw},${cy} ${cx},${y + sh} ${x},${cy}`;
        return <polygon key={n.id} points={pts} fill={fill} />;
      }
      case "pill":
        return (
          <rect
            key={n.id}
            x={x}
            y={y}
            width={sw}
            height={sh}
            rx={sh / 2}
            fill={fill}
          />
        );
      case "hexagon": {
        const qh = sh / 4;
        const pts = [
          `${cx},${y}`,
          `${x + sw},${y + qh}`,
          `${x + sw},${y + sh - qh}`,
          `${cx},${y + sh}`,
          `${x},${y + sh - qh}`,
          `${x},${y + qh}`,
        ].join(" ");
        return <polygon key={n.id} points={pts} fill={fill} />;
      }
      default:
        return (
          <rect
            key={n.id}
            x={x}
            y={y}
            width={sw}
            height={sh}
            rx={3}
            fill={fill}
          />
        );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full"
      style={{ background: "#0D0D0D", display: "block" }}
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#4A4A4A" />
        </marker>
      </defs>
      {edges.map((e) => {
        const src = nodeMap[e.source];
        const tgt = nodeMap[e.target];
        if (!src || !tgt) return null;
        const s = center(src);
        const t = center(tgt);
        return (
          <line
            key={e.id}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="#4A4A4A"
            strokeWidth={1.5}
            markerEnd="url(#arrow)"
          />
        );
      })}
      {nodes.map(renderNode)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

interface StarterTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Template</DialogTitle>
          <DialogDescription>
            Choose a starter template to pre-populate your canvas. Any existing
            nodes will be replaced — use{" "}
            <kbd className="rounded border border-surface-border bg-elevated px-1 py-0.5 text-xs text-copy-secondary">
              ⌘Z
            </kbd>{" "}
            on Mac or{" "}
            <kbd className="rounded border border-surface-border bg-elevated px-1 py-0.5 text-xs text-copy-secondary">
              Ctrl+Z
            </kbd>{" "}
            on Windows to undo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-5 py-2 sm:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col overflow-hidden rounded-xl border border-surface-border bg-elevated"
            >
              <TemplatePreview template={template} />
              <div className="flex flex-col gap-3 p-5">
                <div>
                  <p className="text-[1rem] font-semibold text-copy-primary">
                    {template.name}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-copy-muted">
                    {template.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    onImport(template);
                    onClose();
                  }}
                  className="w-full border-surface-border bg-transparent text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                >
                  <Download className="h-4 w-4" />
                  Import
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
