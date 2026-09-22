import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";
import { RRule } from "rrule";

import { SunnieColorPicker } from "@/components/calendar/SunnieColorPicker";
import { WeekPicker } from "@/components/planning/WeekPicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  formatDateTimeInTimeZone,
  formatTimeInTimeZone,
  newDate,
} from "@/lib/date-utils";
import { RecurrenceConverterFactory } from "@/lib/task-sync/recurrence/recurrence-converter-factory";
import { cn } from "@/lib/utils";

import { useProjectStore } from "@/store/project";
import { useSettingsStore } from "@/store/settings";

import {
  EnergyLevel,
  NewTask,
  Priority,
  Tag,
  Task,
  TaskStatus,
  TimePreference,
} from "@/types/task";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: NewTask) => Promise<void>;
  task?: Task;
  tags: Tag[];
  onCreateTag: (name: string, color?: string) => Promise<Tag>;
  initialProjectId?: string | null;
}

//TODO: move to utils
const formatEnumValue = (value: string) => {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to convert external recurrence rule to RRule format
function getStandardRRule(task?: Task): RRule {
  if (!task?.recurrenceRule) {
    return new RRule({
      freq: RRule.WEEKLY,
      interval: 1,
      byweekday: [RRule.MO],
    });
  }

  // If the task has a source (e.g., OUTLOOK), use the appropriate converter
  if (task.source) {
    const converter = RecurrenceConverterFactory.getConverter(task.source);
    const standardRule = converter.convertFromString(task.recurrenceRule);
    return RRule.fromString(standardRule);
  }

  // If no source or internal task, assume it's already in RRule format
  return RRule.fromString(task.recurrenceRule);
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  tags,
  onCreateTag,
  initialProjectId,
}: TaskModalProps) {
  const { projects, createProject } = useProjectStore();
  const defaultProjectName =
    projects.find(
      (project) =>
        project.status === "active" && project.name.toLowerCase() === "general"
    )?.name ??
    [...projects]
      .filter((project) => project.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name))[0]?.name ??
    "General";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [dueDate, setDueDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [plannedWeek, setPlannedWeek] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | "">("");
  const [preferredTime, setPreferredTime] = useState<TimePreference | "">("");
  const [color, setColor] = useState<string | null>(null);
  const [colorSlot, setColorSlot] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#E5E7EB");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<string | null | undefined>(
    initialProjectId || task?.projectId
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<string | undefined>();
  const [isAutoScheduled, setIsAutoScheduled] = useState(
    task?.isAutoScheduled ?? true
  );
  const [scheduleLocked, setScheduleLocked] = useState(
    task?.scheduleLocked || false
  );
  const [priority, setPriority] = useState<Priority | null>(
    task?.priority || null
  );
  const [showDetails, setShowDetails] = useState(Boolean(task));
  const [createAnother, setCreateAnother] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { user: userSettings } = useSettingsStore();

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStatus(TaskStatus.TODO);
    setDueDate("");
    setStartDate("");
    setPlannedWeek("");
    setDuration("");
    setEnergyLevel("");
    setPreferredTime("");
    setColor(null);
    setColorSlot(null);
    setSelectedTagIds([]);
    setNewTagName("");
    setNewTagColor("#E5E7EB");
    setProjectId(initialProjectId ?? null);
    setIsRecurring(false);
    setRecurrenceRule(undefined);
    setIsAutoScheduled(true);
    setScheduleLocked(false);
    setPriority(null);
    setShowDetails(false);
    setSubmitError(null);
    setNewProjectName("");
    setProjectError(null);
  }, [initialProjectId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setCreateAnother(false);
    }
  }, [isOpen, resetForm]);

  // Populate form with task data when editing
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setPlannedWeek(
        task.plannedWeekStart
          ? new Date(task.plannedWeekStart).toISOString().slice(0, 10)
          : ""
      );
      setDescription(task.description || "");
      setStatus(task.status);
      // Handle date string from API
      if (task.dueDate) {
        const date = newDate(task.dueDate);
        setDueDate(date.toISOString().split("T")[0]);
      } else {
        setDueDate("");
      }
      if (task.startDate) {
        const date = newDate(task.startDate);
        setStartDate(date.toISOString().split("T")[0]);
      } else {
        setStartDate("");
      }
      setDuration(task.duration?.toString() || "");
      setEnergyLevel(task.energyLevel || "");
      setPreferredTime(task.preferredTime || "");
      setColor(task.color ?? null);
      setColorSlot(task.colorSlot ?? null);
      setSelectedTagIds(task.tags.map((t) => t.id));
      setProjectId(task.projectId || null);
      setIsRecurring(task.isRecurring);
      setRecurrenceRule(task.recurrenceRule || undefined);
      setIsAutoScheduled(task.isAutoScheduled);
      setScheduleLocked(task.scheduleLocked);
      setPriority(task.priority || null);
      setShowDetails(true);
      setSubmitError(null);
    } else if (!task && isOpen) {
      resetForm();
    }
  }, [task, isOpen, initialProjectId, resetForm]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate ? newDate(dueDate) : null,
        startDate: startDate ? newDate(startDate) : null,
        plannedWeekStart: plannedWeek
          ? new Date(`${plannedWeek}T00:00:00.000Z`)
          : null,
        duration: duration ? parseInt(duration, 10) : undefined,
        energyLevel: energyLevel || undefined,
        preferredTime: preferredTime || undefined,
        color,
        colorSlot,
        tagIds: selectedTagIds,
        projectId: projectId,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
        isAutoScheduled,
        scheduleLocked,
        priority,
      });
      if (!task && createAnother) {
        resetForm();
        setCreateAnother(true);
        window.requestAnimationFrame(() => titleInputRef.current?.focus());
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error saving task:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Sunnie couldn't save this task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const tag = await onCreateTag(newTagName.trim(), newTagColor);
      setSelectedTagIds([...selectedTagIds, tag.id]);
      setNewTagName("");
      setNewTagColor("#E5E7EB");
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleQuickCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name || creatingProject) return;
    setCreatingProject(true);
    setProjectError(null);
    try {
      const created = await createProject({ name });
      setProjectId(created.id);
      setNewProjectName("");
    } catch (error) {
      setProjectError(
        error instanceof Error ? error.message : "Couldn't create the project."
      );
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:max-w-[560px]">
        {isSubmitting && <LoadingOverlay />}
        <DialogHeader className="shrink-0 border-b border-border px-4 py-4 pr-14 text-left sm:px-6">
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Adjust the plan without losing the task's existing details."
              : "Capture the task now. Add only the planning details that help."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            <div>
              <Label htmlFor="title">What needs doing?</Label>
              <Input
                id="title"
                ref={titleInputRef}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Call the dentist"
                autoComplete="off"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <WeekPicker
                value={plannedWeek}
                onChange={setPlannedWeek}
                disabled={isSubmitting}
              />
              <div>
                <Label htmlFor="duration">Duration</Label>
                <div className="relative">
                  <Input
                    type="number"
                    id="duration"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    placeholder="30"
                    min="0"
                    className="pr-12"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                    min
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={showDetails}
              aria-controls="task-more-details"
              onClick={() => setShowDetails((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/45 px-3 py-2.5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>
                <span className="block text-sm font-semibold">
                  More details
                </span>
                <span className="block text-xs text-muted-foreground">
                  Dates, priority, scheduling, project, tags, color, and repeat
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  showDetails && "rotate-180"
                )}
              />
            </button>

            {showDetails && (
              <div id="task-more-details" className="space-y-5">
                <div>
                  <Label htmlFor="description">Notes</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Anything useful for future you"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as TaskStatus)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue>{formatEnumValue(status)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TaskStatus).map((nextStatus) => (
                          <SelectItem key={nextStatus} value={nextStatus}>
                            {formatEnumValue(nextStatus)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due date</Label>
                    <Input
                      type="date"
                      id="dueDate"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start after</Label>
                    <Input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sunnie will not place it before this date.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={priority || Priority.NONE}
                      onValueChange={(value) => setPriority(value as Priority)}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue>
                          {formatEnumValue(priority || Priority.NONE)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Priority).map((level) => (
                          <SelectItem key={level} value={level}>
                            {formatEnumValue(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="energyLevel">Energy</Label>
                    <Select
                      value={energyLevel || "none"}
                      onValueChange={(value) =>
                        setEnergyLevel(
                          value === "none" ? "" : (value as EnergyLevel)
                        )
                      }
                    >
                      <SelectTrigger id="energyLevel">
                        <SelectValue placeholder="None">
                          {energyLevel ? formatEnumValue(energyLevel) : "None"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Object.values(EnergyLevel).map((level) => (
                          <SelectItem key={level} value={level}>
                            {formatEnumValue(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferredTime">Best time</Label>
                    <Select
                      value={preferredTime || "none"}
                      onValueChange={(value) =>
                        setPreferredTime(
                          value === "none" ? "" : (value as TimePreference)
                        )
                      }
                    >
                      <SelectTrigger id="preferredTime">
                        <SelectValue placeholder="None">
                          {preferredTime
                            ? formatEnumValue(preferredTime)
                            : "None"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Object.values(TimePreference).map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatEnumValue(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Label htmlFor="auto-schedule">Auto-schedule</Label>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        Let Sunnie look for a calm opening in your calendar.
                      </p>
                    </div>
                    <Switch
                      id="auto-schedule"
                      checked={isAutoScheduled}
                      onCheckedChange={setIsAutoScheduled}
                    />
                  </div>

                  {isAutoScheduled && (
                    <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
                      <div>
                        <Label htmlFor="lock-schedule">Keep this time</Label>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                          Do not move its current calendar block.
                        </p>
                      </div>
                      <Switch
                        id="lock-schedule"
                        checked={scheduleLocked}
                        onCheckedChange={setScheduleLocked}
                      />
                    </div>
                  )}

                  {isAutoScheduled &&
                    task?.scheduledStart &&
                    task?.scheduledEnd && (
                      <p className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-secondary-foreground">
                        Scheduled{" "}
                        {formatDateTimeInTimeZone(
                          task.scheduledStart,
                          userSettings.timeZone,
                          userSettings.timeFormat
                        )}
                        {" – "}
                        {formatTimeInTimeZone(
                          task.scheduledEnd,
                          userSettings.timeZone,
                          userSettings.timeFormat
                        )}
                      </p>
                    )}
                </div>

                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={projectId || "none"}
                    onValueChange={(value) =>
                      setProjectId(value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder={defaultProjectName} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {defaultProjectName} (default)
                      </SelectItem>
                      {projects
                        .filter((project) => project.status === "active")
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex gap-2">
                    <Input
                      aria-label="New project name"
                      placeholder="New project name"
                      value={newProjectName}
                      onChange={(event) =>
                        setNewProjectName(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleQuickCreateProject();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!newProjectName.trim() || creatingProject}
                      onClick={() => void handleQuickCreateProject()}
                    >
                      Create
                    </Button>
                  </div>
                  {projectError && (
                    <p role="alert" className="mt-1 text-xs text-destructive">
                      {projectError}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Calendar color</Label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Optional. Automatic color follows your active Sunnie theme.
                  </p>
                  <SunnieColorPicker
                    paletteName="tasks"
                    value={color}
                    valueSlot={colorSlot}
                    onChange={(nextColor, nextSlot) => {
                      setColor(nextColor);
                      setColorSlot(nextSlot);
                    }}
                    allowDefault
                    defaultLabel="Use automatic task color"
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <label
                          key={tag.id}
                          className={cn(
                            "inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-sm transition-colors",
                            selectedTagIds.includes(tag.id)
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground hover:bg-muted/70"
                          )}
                        >
                          <Checkbox
                            className="sr-only"
                            checked={selectedTagIds.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              setSelectedTagIds((current) =>
                                checked
                                  ? [...current, tag.id]
                                  : current.filter((id) => id !== tag.id)
                              );
                            }}
                          />
                          <span
                            className="mr-2 h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: tag.color || "var(--muted)",
                            }}
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_2.5rem_auto] gap-2">
                    <Input
                      value={newTagName}
                      onChange={(event) => setNewTagName(event.target.value)}
                      placeholder="New tag"
                    />
                    <Input
                      aria-label="New tag color"
                      type="color"
                      value={newTagColor}
                      onChange={(event) => setNewTagColor(event.target.value)}
                      className="h-10 w-10 p-1"
                    />
                    <Button
                      type="button"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      variant="secondary"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={(checked) => {
                        setIsRecurring(checked as boolean);
                        if (checked) {
                          if (!dueDate) {
                            const today = newDate();
                            setDueDate(today.toISOString().split("T")[0]);
                          }
                          if (!recurrenceRule) {
                            setRecurrenceRule(
                              new RRule({
                                freq: RRule.WEEKLY,
                                interval: 1,
                                byweekday: [RRule.MO],
                              }).toString()
                            );
                          }
                        }
                      }}
                    />
                    <Label htmlFor="recurring">Repeat this task</Label>
                  </div>
                  {isRecurring && (
                    <div className="mt-2 space-y-3 pl-6">
                      <Label>Repeat every</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          aria-label="Repeat interval"
                          type="number"
                          min="1"
                          value={
                            recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task).options.interval || 1
                              : 1
                          }
                          onChange={(event) => {
                            const interval = parseInt(event.target.value) || 1;
                            const currentRule = recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task)
                              : new RRule({
                                  freq: RRule.WEEKLY,
                                  interval: 1,
                                  byweekday: [RRule.MO],
                                });
                            setRecurrenceRule(
                              new RRule({
                                ...currentRule.options,
                                interval,
                              }).toString()
                            );
                          }}
                          className="w-20"
                        />
                        <Select
                          value={
                            recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task).options.freq.toString()
                              : RRule.WEEKLY.toString()
                          }
                          onValueChange={(value) => {
                            const freq = parseInt(value);
                            const currentRule = recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task)
                              : new RRule({
                                  freq: RRule.WEEKLY,
                                  interval: 1,
                                  byweekday: [RRule.MO],
                                });
                            setRecurrenceRule(
                              new RRule({
                                ...currentRule.options,
                                freq,
                                byweekday:
                                  freq === RRule.WEEKLY ? [RRule.MO] : null,
                              }).toString()
                            );
                          }}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RRule.DAILY.toString()}>
                              days
                            </SelectItem>
                            <SelectItem value={RRule.WEEKLY.toString()}>
                              weeks
                            </SelectItem>
                            <SelectItem value={RRule.MONTHLY.toString()}>
                              months
                            </SelectItem>
                            <SelectItem value={RRule.YEARLY.toString()}>
                              years
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {submitError && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {submitError}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
            {!task && (
              <label className="mr-auto flex min-h-10 cursor-pointer items-center gap-2 text-sm text-secondary-foreground">
                <Checkbox
                  aria-label="Keep this open for another"
                  checked={createAnother}
                  onCheckedChange={(checked) =>
                    setCreateAnother(checked === true)
                  }
                />
                Keep this open for another
              </label>
            )}
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !title.trim()}>
                {isSubmitting
                  ? "Saving…"
                  : task
                    ? "Save changes"
                    : createAnother
                      ? "Create & continue"
                      : "Create task"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
