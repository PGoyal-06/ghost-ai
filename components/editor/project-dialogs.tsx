"use client";

import { useEffect, useRef, useState } from "react";
import { useProjectDialogs } from "./project-dialogs-context";
import { useProjectActions } from "@/hooks/use-project-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

interface ProjectNameDialogFormProps {
  initialName: string;
  isSubmitting: boolean;
  mode: "create" | "rename";
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

function ProjectNameDialogForm({
  initialName,
  isSubmitting,
  mode,
  onClose,
  onSubmit,
}: ProjectNameDialogFormProps) {
  const [name, setName] = useState(initialName);
  const [suffix] = useState(() => Math.random().toString(36).slice(2, 6));
  const inputRef = useRef<HTMLInputElement>(null);
  const roomId = name ? `${slugify(name)}-${suffix}` : "";

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim()) {
      await onSubmit(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-white">
          {mode === "create" ? "Create Project" : "Rename Project"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Enter a name for your new architecture workspace."
            : "Update the project name."}
        </DialogDescription>
      </DialogHeader>
      <div className="py-6">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          disabled={isSubmitting}
          className="text-white"
        />
        {mode === "create" && roomId ? (
          <p className="mt-2 text-xs text-copy-muted">
            Room ID: <span className="text-copy-primary">{roomId}</span>
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectDialogs() {
  const { isOpen, activeProject, closeDialog } = useProjectDialogs();
  const { create, rename, remove, isSubmitting } = useProjectActions();

  const nameDialogMode =
    isOpen === "create" || isOpen === "rename" ? isOpen : null;
  const nameDialogKey = `${nameDialogMode ?? "closed"}-${activeProject?.id ?? "new"}`;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeProject) {
      await remove(activeProject.id);
    }
  };

  return (
    <>
      <Dialog
        open={nameDialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          {nameDialogMode ? (
            <ProjectNameDialogForm
              key={nameDialogKey}
              initialName={
                nameDialogMode === "rename" ? (activeProject?.name ?? "") : ""
              }
              isSubmitting={isSubmitting}
              mode={nameDialogMode}
              onClose={closeDialog}
              onSubmit={(name) =>
                nameDialogMode === "create"
                  ? create(name)
                  : activeProject
                    ? rename(activeProject.id, name)
                    : Promise.resolve()
              }
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpen === "delete"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <form onSubmit={handleDelete}>
            <DialogHeader>
              <DialogTitle className="text-white">Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{activeProject?.name}
                &rdquo;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
