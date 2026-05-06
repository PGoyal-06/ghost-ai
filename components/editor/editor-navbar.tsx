"use client";

import {
  Bot,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenShareDialog?: () => void;
  onOpenTemplatesModal?: () => void;
  projectName?: string;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  onOpenShareDialog,
  onOpenTemplatesModal,
  projectName,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
}: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-12 z-50 flex items-center bg-surface border-b border-surface-border">
      <div className="flex min-w-0 items-center gap-3 px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-copy-secondary hover:text-copy-primary"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>

        {projectName ? (
          <>
            <div className="h-5 w-px bg-surface-border" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-copy-primary">
                {projectName}
              </p>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 px-3">
        {onOpenTemplatesModal ? (
          <Button
            variant="ghost"
            onClick={onOpenTemplatesModal}
            className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
        ) : null}

        {projectName && onOpenShareDialog ? (
          <Button
            variant="outline"
            onClick={onOpenShareDialog}
            className="border-surface-border bg-elevated text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        ) : null}

        {onToggleAiSidebar ? (
          <Button
            variant="ghost"
            onClick={onToggleAiSidebar}
            className={cn(
              "text-copy-secondary hover:bg-subtle hover:text-copy-primary",
              isAiSidebarOpen ? "bg-accent-dim text-brand" : undefined,
            )}
          >
            <Bot className="h-4 w-4" />
            AI
            {isAiSidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        ) : null}

        <UserButton />
      </div>
    </header>
  );
}
