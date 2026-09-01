"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Textarea } from "@/components/ui/textarea";

import {
  DEFAULT_PROJECT_COLOR,
  SUNNIE_PROJECT_COLORS,
} from "@/lib/project-colors";
import { cn } from "@/lib/utils";

import { useProjectStore } from "@/store/project";

import { Project, ProjectStatus } from "@/types/project";

import { DeleteProjectDialog } from "./DeleteProjectDialog";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const { createProject, updateProject } = useProjectStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_PROJECT_COLOR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(project.color || DEFAULT_PROJECT_COLOR);
    } else if (!project && isOpen) {
      setName("");
      setDescription("");
      setColor(DEFAULT_PROJECT_COLOR);
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (project) {
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        });
      } else {
        await createProject({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          status: ProjectStatus.ACTIVE,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px]">
          {isSubmitting && <LoadingOverlay />}
          <DialogHeader>
            <DialogTitle>
              {project ? "Edit Project" : "Create Project"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <fieldset>
              <legend className="text-sm font-medium">Project color</legend>
              <p className="mt-1 text-xs text-muted-foreground">
                This colors the project tile only, not the tasks inside it.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {SUNNIE_PROJECT_COLORS.map((preset) => {
                  const isSelected = color.toUpperCase() === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      aria-label={`Use ${preset.name}`}
                      aria-pressed={isSelected}
                      title={preset.name}
                      onClick={() => setColor(preset.value)}
                      className={cn(
                        "h-11 rounded-xl border border-black/10 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64734a] focus-visible:ring-offset-2 motion-reduce:transform-none",
                        isSelected &&
                          "ring-2 ring-[#596741] ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: preset.value }}
                    >
                      <span className="sr-only">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
              <Label htmlFor="color" className="mt-4 block text-xs">
                Custom color
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="color"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 cursor-pointer p-1"
                />
                <div
                  className="flex h-10 flex-1 items-center rounded-xl border px-3 text-xs font-medium text-[#414530]"
                  style={{ backgroundColor: color }}
                >
                  Project tile preview
                </div>
              </div>
            </fieldset>

            <div className="flex justify-between pt-4">
              {project && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSubmitting}
                >
                  Delete Project
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Project"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {project && (
        <DeleteProjectDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          project={{ ...project, onClose }}
          taskCount={project._count?.tasks || 0}
        />
      )}
    </>
  );
}
