"use client";

import { useCallback, useEffect, useState } from "react";

import {
  RefreshCw as BsArrowRepeat,
  ChevronLeft,
  ChevronRight,
  FolderOpen as HiFolderOpen,
  Pencil as HiPencil,
  Plus as HiPlus,
} from "lucide-react";
import { toast } from "sonner";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";

import { getReadableTextColor } from "@/lib/color-contrast";
import { resolveThemeLinkedColor } from "@/lib/color-themes";
import { isSaasEnabled } from "@/lib/config";
import { DEFAULT_PROJECT_COLOR } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

import { useProjectStore } from "@/store/project";
import { useTaskStore } from "@/store/task";

import { Project, ProjectStatus } from "@/types/project";
import { TaskStatus } from "@/types/task";

import { useDroppableProject } from "../dnd/useDragAndDrop";
import { ProjectModal } from "./ProjectModal";

// Special project object to represent "no project" state
const NO_PROJECT: Partial<Project> = {
  id: "no-project",
  name: "No Project",
};

// Interface for task list mappings
interface TaskListMapping {
  id: string;
  providerId: string;
  projectId: string;
  externalListId: string;
  externalListName: string;
}

export function ProjectSidebar() {
  const {
    projects,
    loading,
    error,
    fetchProjects,
    setActiveProject,
    activeProject,
  } = useProjectStore();
  const { tasks } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [projectMappings, setProjectMappings] = useState<
    Record<string, TaskListMapping[]>
  >({});
  const [syncingProjects, setSyncingProjects] = useState<Set<string>>(
    new Set()
  );

  const { droppableProps: removeProjectProps, isOver: isOverRemove } =
    useDroppableProject(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const roomyWindow = window.matchMedia("(min-width: 1280px)");
    const syncWithWindow = (event?: MediaQueryListEvent) =>
      setIsSidebarOpen(event?.matches ?? roomyWindow.matches);
    syncWithWindow();
    roomyWindow.addEventListener("change", syncWithWindow);
    return () => roomyWindow.removeEventListener("change", syncWithWindow);
  }, []);

  // Fetch task list mappings for projects
  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectMappings();
    }
  }, [projects]);

  const fetchProjectMappings = async () => {
    try {
      const response = await fetch("/api/task-sync/mappings");
      const data = await response.json();

      if (data.mappings) {
        // Group mappings by project ID
        const mappingsByProject: Record<string, TaskListMapping[]> = {};

        data.mappings.forEach((mapping: TaskListMapping) => {
          if (!mappingsByProject[mapping.projectId]) {
            mappingsByProject[mapping.projectId] = [];
          }
          mappingsByProject[mapping.projectId].push(mapping);
        });

        setProjectMappings(mappingsByProject);
      }
    } catch (error) {
      console.error("Failed to fetch task list mappings:", error);
    }
  };

  const handleSyncProject = useCallback(
    async (projectId: string, mappingId: string) => {
      if (syncingProjects.has(projectId)) return;

      try {
        setSyncingProjects((prev) => new Set(prev).add(projectId));

        const response = await fetch("/api/task-sync/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mappingId,
            direction: "bidirectional",
          }),
        });

        if (response.ok) {
          if (isSaasEnabled) {
            toast.success("Task sync initiated for project");
          } else {
            const { fetchTasks } = useTaskStore.getState();
            await fetchTasks();
            toast.success("Sync Completed");
          }
        } else {
          toast.error("Failed to sync tasks for project");
        }
      } catch (error) {
        console.error("Failed to sync project tasks:", error);
        toast.error("Failed to sync tasks for project");
      } finally {
        setSyncingProjects((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }
    },
    [syncingProjects]
  );

  const activeProjects = projects.filter(
    (project) => project.status === ProjectStatus.ACTIVE
  );
  const archivedProjects = projects.filter(
    (project) => project.status === ProjectStatus.ARCHIVED
  );

  // Count non-completed tasks with no project
  const unassignedTasksCount = tasks.filter(
    (task) => !task.projectId && task.status !== TaskStatus.COMPLETED
  ).length;

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "relative z-40 hidden flex-none flex-col self-stretch bg-card transition-[width] duration-300 md:flex",
          isSidebarOpen ? "w-64" : "w-6"
        )}
      >
        <button
          type="button"
          onClick={() => setIsSidebarOpen((current) => !current)}
          aria-label={
            isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"
          }
          title={
            isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"
          }
          className="absolute -right-[27px] top-4 z-[70] grid h-11 w-7 place-items-center rounded-r-xl border border-l-0 border-border bg-card text-secondary-foreground transition-colors hover:bg-muted"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
        <aside
          className={cn(
            "sunnie-theme-sidebar-pattern relative z-50 flex min-h-0 w-64 flex-1 flex-col border-r border-border bg-card shadow-[var(--shadow-raised)] transition-transform duration-300",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="border-b p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Projects</h2>
              <Button
                size="icon"
                aria-label="Add project"
                onClick={() => {
                  setSelectedProject(undefined);
                  setIsModalOpen(true);
                }}
              >
                <HiPlus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Button
                variant={!activeProject ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveProject(null)}
              >
                All Tasks
              </Button>
              <Button
                variant={
                  activeProject?.id === NO_PROJECT.id ? "secondary" : "ghost"
                }
                className="w-full justify-start gap-2"
                onClick={() => setActiveProject(NO_PROJECT as Project)}
              >
                <HiFolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">No Project</span>
                <span className="text-xs text-muted-foreground">
                  {unassignedTasksCount}
                </span>
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {loading && projects.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-sm text-muted-foreground">
                  Loading projects...
                </div>
              </div>
            ) : error && projects.length === 0 ? (
              <div className="p-2 text-sm text-destructive">
                {error.message}
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.length > 0 && (
                  <div className="space-y-1">
                    {activeProjects.map((project) => (
                      <ProjectItem
                        key={project.id}
                        project={project}
                        isActive={activeProject?.id === project.id}
                        onEdit={handleEditProject}
                        mappings={projectMappings[project.id] || []}
                        isSyncing={syncingProjects.has(project.id)}
                        onSync={handleSyncProject}
                      />
                    ))}
                  </div>
                )}

                {archivedProjects.length > 0 && (
                  <div className="space-y-1">
                    <div className="py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Archived
                    </div>
                    {archivedProjects.map((project) => (
                      <ProjectItem
                        key={project.id}
                        project={project}
                        isActive={activeProject?.id === project.id}
                        onEdit={handleEditProject}
                        mappings={projectMappings[project.id] || []}
                        isSyncing={syncingProjects.has(project.id)}
                        onSync={handleSyncProject}
                      />
                    ))}
                  </div>
                )}

                {projects.length === 0 && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No projects yet
                  </div>
                )}

                {/* Remove from project drop zone */}
                <div
                  {...removeProjectProps}
                  className={cn(
                    "mt-4 rounded-md border-2 border-dashed p-4 text-center",
                    isOverRemove
                      ? "border-destructive bg-destructive/10"
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                >
                  <p className="text-sm text-muted-foreground">
                    Drop here to remove from project
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(undefined);
        }}
        project={selectedProject}
        onCreated={() => setIsSidebarOpen(true)}
      />
    </>
  );
}

export function MobileProjectPicker() {
  const { colorTheme } = useTheme();
  const { projects, activeProject, setActiveProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const activeProjects = projects.filter(
    (project) => project.status === ProjectStatus.ACTIVE
  );
  const unassignedTasksCount = tasks.filter(
    (task) => !task.projectId && task.status !== TaskStatus.COMPLETED
  ).length;

  return (
    <div className="mt-3 border-t border-border/70 pt-3 md:hidden">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Projects
        </button>
        {isExpanded && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground"
          >
            <HiPlus className="h-3.5 w-3.5" /> New project
          </button>
        )}
      </div>
      {isExpanded && (
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveProject(null)}
            className={cn(
              "shrink-0 snap-start rounded-xl border px-3 py-2 text-xs font-semibold",
              !activeProject
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card/70 text-foreground"
            )}
          >
            All tasks
          </button>
          <button
            type="button"
            onClick={() => setActiveProject(NO_PROJECT as Project)}
            className={cn(
              "shrink-0 snap-start rounded-xl border px-3 py-2 text-xs font-semibold",
              activeProject?.id === NO_PROJECT.id
                ? "border-primary bg-muted text-foreground ring-1 ring-primary"
                : "border-border bg-card/70 text-foreground"
            )}
          >
            No project · {unassignedTasksCount}
          </button>
          {activeProjects.map((project) => {
            const tileColor = resolveThemeLinkedColor(
              "projects",
              project.colorSlot,
              project.color || DEFAULT_PROJECT_COLOR,
              colorTheme.id
            );
            const textColor = getReadableTextColor(tileColor);
            const count = tasks.filter(
              (task) =>
                task.projectId === project.id &&
                task.status !== TaskStatus.COMPLETED
            ).length;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveProject(project)}
                className={cn(
                  "shrink-0 snap-start rounded-xl border border-border/80 px-3 py-2 text-xs font-semibold shadow-sm",
                  activeProject?.id === project.id &&
                    "ring-2 ring-primary ring-offset-2"
                )}
                style={{ backgroundColor: tileColor, color: textColor }}
              >
                {project.name} · {count}
              </button>
            );
          })}
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => setIsExpanded(true)}
      />
    </div>
  );
}

interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  onEdit: (project: Project) => void;
  mappings: TaskListMapping[];
  isSyncing: boolean;
  onSync: (projectId: string, mappingId: string) => void;
}

function ProjectItem({
  project,
  isActive,
  onEdit,
  mappings,
  isSyncing,
  onSync,
}: ProjectItemProps) {
  const { colorTheme } = useTheme();
  const { setActiveProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const { droppableProps, isOver } = useDroppableProject(project);

  // Count non-completed tasks for this project
  const taskCount = tasks.filter(
    (task) =>
      task.projectId === project.id && task.status !== TaskStatus.COMPLETED
  ).length;

  // Check if project has any task mappings
  const hasMappings = mappings.length > 0;
  const tileColor = resolveThemeLinkedColor(
    "projects",
    project.colorSlot,
    project.color || DEFAULT_PROJECT_COLOR,
    colorTheme.id
  );
  const textColor = getReadableTextColor(tileColor);

  return (
    <div
      {...droppableProps}
      className={cn(
        "group flex min-h-11 w-full cursor-pointer items-center space-x-2 rounded-xl border border-border/70 px-3 py-2.5 shadow-[var(--shadow-paper)] transition hover:-translate-y-0.5 hover:brightness-[1.02] hover:shadow-sm motion-reduce:transform-none",
        isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isOver &&
          "z-10 scale-[1.03] ring-2 ring-accent ring-offset-2 ring-offset-background"
      )}
      style={{ backgroundColor: tileColor, color: textColor }}
      onClick={() => setActiveProject(project)}
    >
      <HiFolderOpen className="h-4 w-4 shrink-0 opacity-70" />
      <span className="project-name flex-1 truncate font-medium">
        {project.name}
      </span>
      <span className="text-xs opacity-70">{taskCount}</span>

      {hasMappings && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Sync ${project.name}`}
          className="h-6 w-6 p-0.5 text-current opacity-0 transition-opacity hover:bg-card/25 group-hover:opacity-100"
          disabled={isSyncing}
          onClick={(e) => {
            e.stopPropagation();
            onSync(project.id, mappings[0].id);
          }}
        >
          <BsArrowRepeat
            className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")}
          />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${project.name}`}
        className="h-6 w-6 p-0.5 text-current opacity-0 transition-opacity hover:bg-card/25 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(project);
        }}
      >
        <HiPencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
