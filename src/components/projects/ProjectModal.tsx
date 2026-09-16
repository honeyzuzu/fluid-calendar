"use client";

import { useEffect, useState } from "react";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Textarea } from "@/components/ui/textarea";

import { getReadableTextColor } from "@/lib/color-contrast";
import { resolveThemeLinkedColor } from "@/lib/color-themes";
import { DEFAULT_PROJECT_COLOR } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

import { useProjectStore } from "@/store/project";

import { Project, ProjectStatus } from "@/types/project";

import { DeleteProjectDialog } from "./DeleteProjectDialog";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  onCreated?: (project: Project) => void;
}

export function ProjectModal({
  isOpen,
  onClose,
  project,
  onCreated,
}: ProjectModalProps) {
  const { colorTheme } = useTheme();
  const projectColors = colorTheme.palettes.projects;
  const defaultProjectColor = projectColors[0]?.value || DEFAULT_PROJECT_COLOR;
  const { createProject, updateProject } = useProjectStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_PROJECT_COLOR);
  const [colorSlot, setColorSlot] = useState<string | null>("project-1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(
        resolveThemeLinkedColor(
          "projects",
          project.colorSlot,
          project.color,
          colorTheme.id
        )
      );
      setColorSlot(project.colorSlot || null);
    } else if (!project && isOpen) {
      setName("");
      setDescription("");
      setColor(defaultProjectColor);
      setColorSlot("project-1");
    }
    if (isOpen) setSubmitError(null);
  }, [project, isOpen, defaultProjectColor, colorTheme.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (project) {
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          colorSlot,
        });
      } else {
        const createdProject = await createProject({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          colorSlot,
          status: ProjectStatus.ACTIVE,
        });
        onCreated?.(createdProject);
      }
      onClose();
    } catch (error) {
      console.error("Error saving project:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Sunnie couldn't save that project. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) onClose();
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          {isSubmitting && <LoadingOverlay />}
          <DialogHeader>
            <DialogTitle>
              {project ? "Edit Project" : "Create Project"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {project
                ? "Update this project's name, description, and color."
                : "Create a project with a name, description, and color."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}
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
              <p className="mt-1 text-sm font-semibold text-primary">
                {colorTheme.paletteNames.projects}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This colors the project tile only, not the tasks inside it.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {projectColors.map((preset) => {
                  const isSelected = colorSlot === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-label={`Use ${preset.name}`}
                      aria-pressed={isSelected}
                      title={preset.name}
                      onClick={() => {
                        setColor(preset.value);
                        setColorSlot(preset.id);
                      }}
                      className={cn(
                        "h-11 rounded-xl border border-border/80 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transform-none",
                        isSelected &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: preset.value }}
                    >
                      <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {preset.name}
                      </span>
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
                  onChange={(e) => {
                    setColor(e.target.value);
                    setColorSlot(null);
                  }}
                  className="h-10 w-20 cursor-pointer p-1"
                />
                <div
                  className="flex h-10 flex-1 items-center rounded-xl border px-3 text-xs font-medium"
                  style={{
                    backgroundColor: color,
                    color: getReadableTextColor(color),
                  }}
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
