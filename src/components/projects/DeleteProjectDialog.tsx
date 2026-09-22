"use client";

import { useState } from "react";

import * as Dialog from "@radix-ui/react-dialog";
import { X as IoClose, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { useProjectStore } from "@/store/project";

import { Project } from "@/types/project";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  taskCount: number;
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  project,
  taskCount,
}: DeleteProjectDialogProps) {
  const { deleteProject } = useProjectStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      onClose();
      project.onClose?.();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Could not delete the project. Your tasks are unchanged.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlayShow fixed inset-0 z-[60] bg-foreground/25 backdrop-blur-[2px]" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 z-[61] max-h-[85vh] w-[calc(100vw-2rem)] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 text-foreground shadow-[var(--shadow-raised)] focus:outline-none">
          <Dialog.Title className="m-0 text-[17px] font-medium">
            Delete Project
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="mb-5 mt-4 text-[15px] leading-normal">
              <p className="mb-3">
                Are you sure you want to delete <strong>{project.name}</strong>?
              </p>
              <p className="mb-3 flex items-start gap-2 font-bold text-destructive">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This action cannot be undone. The project will be permanently
                  deleted.
                </span>
              </p>
              {taskCount > 0 && (
                <p>
                  {taskCount} task{taskCount === 1 ? "" : "s"} will move to
                  another project. No tasks will be deleted.
                </p>
              )}
            </div>
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-4">
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-3 top-3 inline-flex h-9 w-9 appearance-none items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
              disabled={isDeleting}
            >
              <IoClose />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
