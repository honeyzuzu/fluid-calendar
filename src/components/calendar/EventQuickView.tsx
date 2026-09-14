import { useState } from "react";

import {
  Check as HiCheck,
  Pencil as HiPencil,
  Trash2 as HiTrash,
  CalendarDays as IoCalendarOutline,
  Flag as IoFlagOutline,
  Folder as IoFolderOutline,
  MapPin as IoLocationOutline,
  LockKeyhole as IoLockClosedOutline,
  Users as IoPeopleOutline,
  Repeat2 as IoRepeat,
  Clock3 as IoTimeOutline,
} from "lucide-react";

import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SunnieDeleteDialog } from "@/components/ui/sunnie-delete-dialog";

import { format, isFutureDate, newDate } from "@/lib/date-utils";
import { getProjectDisplayColor } from "@/lib/project-colors";
import { isTaskOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

import { AttendeeStatus, CalendarEvent } from "@/types/calendar";
import { Priority, Task, TaskStatus } from "@/types/task";

interface Attendee {
  name?: string;
  email: string;
  status?: AttendeeStatus;
}

interface EventQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  item:
    | (CalendarEvent & {
        attendees?: Attendee[];
        extendedProps?: { isTask?: boolean };
      })
    | (Task & {
        project?: {
          name: string;
          color?: string | null;
          colorSlot?: string | null;
        } | null;
      });
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  isTask: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  referenceElement: HTMLElement | null;
}

//TODO: move to utils
const priorityColors = {
  [Priority.HIGH]: "text-destructive dark:text-destructive",
  [Priority.MEDIUM]: "text-warning dark:text-warning",
  [Priority.LOW]: "text-primary dark:text-primary",
  [Priority.NONE]: "text-muted-foreground",
};

export function EventQuickView({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
  isTask,
  onStatusChange,
  referenceElement,
}: EventQuickViewProps) {
  const { colorTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED":
      case TaskStatus.COMPLETED:
        return "text-success";
      case "TENTATIVE":
      case TaskStatus.IN_PROGRESS:
        return "text-warning dark:text-warning";
      case "DECLINED":
        return "text-destructive dark:text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  // Cast item to the appropriate type based on isTask
  const taskItem = isTask ? (item as Task) : null;
  const eventItem = !isTask
    ? (item as CalendarEvent & { attendees?: Attendee[] })
    : null;

  const isOverdue = taskItem && isTaskOverdue(taskItem);

  return (
    <>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !showDeleteDialog) onClose();
        }}
      >
        <PopoverTrigger asChild>
          <div
            className="w-0 h-0 opacity-0 pointer-events-none"
            style={{
              position: "fixed",
              left: referenceElement
                ? referenceElement.getBoundingClientRect().left
                : 0,
              top: referenceElement
                ? referenceElement.getBoundingClientRect().top
                : 0,
            }}
          />
        </PopoverTrigger>
        <PopoverContent
          className="z-[10000] w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-background p-4 shadow-lg"
          align="start"
          sideOffset={24}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(event) => {
            if (showDeleteDialog) event.preventDefault();
          }}
          forceMount
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="event-title flex items-center gap-2 font-medium text-foreground">
                {item.title}
                {isTask ? (
                  <>
                    {taskItem?.isRecurring && (
                      <IoRepeat
                        className="h-4 w-4 text-primary"
                        aria-label="Recurring task"
                      />
                    )}
                    {taskItem?.scheduleLocked && (
                      <IoLockClosedOutline
                        className="h-4 w-4 text-warning"
                        aria-label="Schedule locked"
                      />
                    )}
                  </>
                ) : (
                  eventItem?.isRecurring && (
                    <IoRepeat
                      className="h-4 w-4 text-primary"
                      aria-label="Recurring event"
                    />
                  )
                )}
              </h3>
              <div className="flex items-center gap-1">
                {isTask && taskItem && onStatusChange && (
                  <button
                    onClick={() =>
                      onStatusChange(
                        taskItem.id,
                        taskItem.status === TaskStatus.COMPLETED
                          ? TaskStatus.TODO
                          : TaskStatus.COMPLETED
                      )
                    }
                    className={cn(
                      "rounded-md p-1.5",
                      taskItem.status === TaskStatus.COMPLETED
                        ? "bg-success/15 text-success hover:bg-success/25"
                        : "text-muted-foreground hover:bg-muted hover:text-success"
                    )}
                    title={
                      taskItem.status === TaskStatus.COMPLETED
                        ? "Mark as todo"
                        : "Mark as completed"
                    }
                  >
                    <HiCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onEdit}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                  title="Edit"
                >
                  <HiPencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  title="Delete"
                >
                  <HiTrash className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isTask && eventItem && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <IoTimeOutline className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {format(newDate(eventItem.start), "PPp")} -{" "}
                    {format(
                      newDate(eventItem.end),
                      eventItem.allDay ? "PP" : "p"
                    )}
                  </span>
                </div>
                {eventItem.location && (
                  <div className="flex items-center gap-2">
                    <IoLocationOutline className="h-4 w-4 flex-shrink-0" />
                    <span className="event-location line-clamp-2">
                      {eventItem.location}
                    </span>
                  </div>
                )}
                {eventItem.attendees && eventItem.attendees.length > 0 && (
                  <div className="flex items-start gap-2">
                    <IoPeopleOutline className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div className="flex-1">
                      {eventItem.attendees.map((attendee) => (
                        <div
                          key={attendee.email}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="event-attendees flex-1 truncate">
                            {attendee.name || attendee.email}
                          </span>
                          <span
                            className={cn(
                              "ml-2 flex-shrink-0",
                              getStatusColor(attendee.status)
                            )}
                          >
                            {attendee.status?.toLowerCase() || "pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {eventItem.description && (
                  <div className="event-description mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {eventItem.description}
                  </div>
                )}
              </div>
            )}

            {isTask && taskItem && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="h-4 w-4 flex-shrink-0" />
                    {taskItem.dueDate ? (
                      <span
                        className={cn(
                          isOverdue && "font-medium text-destructive",
                          isFutureDate(taskItem.dueDate) &&
                            "text-primary font-medium"
                        )}
                      >
                        Due {format(newDate(taskItem.dueDate), "PPp")}
                        {isOverdue && " (OVERDUE)"}
                        {isFutureDate(taskItem.dueDate) && " (UPCOMING)"}
                      </span>
                    ) : (
                      <span>No due date</span>
                    )}
                  </div>
                  <span
                    className={cn("rounded-full px-2 py-0.5 text-xs", {
                      "bg-success/15 text-success":
                        taskItem.status === TaskStatus.COMPLETED,
                      "bg-warning/10 text-warning":
                        taskItem.status === TaskStatus.IN_PROGRESS,
                      "bg-muted text-muted-foreground":
                        taskItem.status === TaskStatus.TODO,
                    })}
                  >
                    {taskItem.status.toLowerCase().replace("_", " ")}
                  </span>
                </div>

                {taskItem.startDate && (
                  <div className="flex items-center gap-2">
                    <IoCalendarOutline className="h-4 w-4 flex-shrink-0" />
                    <span
                      className={cn(
                        isFutureDate(taskItem.startDate) &&
                          "text-primary font-medium"
                      )}
                    >
                      Starts {format(newDate(taskItem.startDate), "PPp")}
                      {isFutureDate(taskItem.startDate) && " (UPCOMING)"}
                    </span>
                  </div>
                )}

                {taskItem.priority && (
                  <div className="flex items-center gap-2">
                    <IoFlagOutline className="h-4 w-4 flex-shrink-0" />
                    <span
                      className={cn(
                        "text-sm",
                        priorityColors[taskItem.priority]
                      )}
                    >
                      {taskItem.priority.charAt(0).toUpperCase() +
                        taskItem.priority.slice(1)}{" "}
                      Priority
                    </span>
                  </div>
                )}

                {taskItem.isAutoScheduled &&
                  taskItem.scheduledStart &&
                  taskItem.scheduledEnd && (
                    <div className="flex items-center gap-2">
                      <IoCalendarOutline className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1">
                        <div>
                          Scheduled:{" "}
                          {format(newDate(taskItem.scheduledStart), "PPp")} -{" "}
                          {format(newDate(taskItem.scheduledEnd), "p")}
                        </div>
                      </div>
                    </div>
                  )}

                {taskItem.project && (
                  <div className="flex items-center gap-2">
                    <IoFolderOutline className="h-4 w-4 flex-shrink-0" />
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: `${getProjectDisplayColor(
                          taskItem.project,
                          colorTheme.id
                        )}20`,
                        color: getProjectDisplayColor(
                          taskItem.project,
                          colorTheme.id
                        ),
                      }}
                    >
                      {taskItem.project.name}
                    </span>
                  </div>
                )}

                {taskItem.duration && (
                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="h-4 w-4 flex-shrink-0" />
                    <span>Duration: {taskItem.duration} minutes</span>
                  </div>
                )}

                {taskItem.tags && taskItem.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {taskItem.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor:
                            (tag.color || "hsl(var(--primary))") + "20",
                          color: tag.color || "hsl(var(--primary))",
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {taskItem.description && (
                  <div className="task-description mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {taskItem.description}
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <SunnieDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        itemType={isTask ? "task" : "event"}
        itemName={item.title}
        onConfirm={onDelete}
      />
    </>
  );
}
