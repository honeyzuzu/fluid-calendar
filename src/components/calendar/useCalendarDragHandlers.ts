import { createElement, useCallback, useState } from "react";

import type { EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { toast } from "sonner";

import { DropUpdate, computeDropUpdate } from "@/lib/calendar-drag";

import { useCalendarStore } from "@/store/calendar";
import { useTaskStore } from "@/store/task";

import { CalendarEvent } from "@/types/calendar";

import {
  RecurringEventScope,
  RecurringEventScopeDialog,
} from "./RecurringEventScopeDialog";

type EventDropUpdate = Extract<DropUpdate, { kind: "event" }>;

interface PendingRecurringChange {
  info: EventDropArg | EventResizeDoneArg;
  isResize: boolean;
  update: EventDropUpdate;
}

// Shared eventDrop/eventResize handlers for the calendar views. The views
// spread the original store item into extendedProps, so it is recovered here.
export function useCalendarDragHandlers() {
  const feeds = useCalendarStore((s) => s.feeds);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const updateTask = useTaskStore((s) => s.updateTask);
  const [pendingRecurringChange, setPendingRecurringChange] =
    useState<PendingRecurringChange | null>(null);

  const saveEventChange = useCallback(
    async (pending: PendingRecurringChange, scope?: RecurringEventScope) => {
      try {
        await updateEvent(
          pending.update.eventId,
          pending.update.updates,
          scope
        );
      } catch (error) {
        console.error("Failed to apply calendar drag change:", error);
        pending.info.revert();
        toast.error(
          pending.isResize ? "Failed to resize item" : "Failed to move item"
        );
      }
    },
    [updateEvent]
  );

  const applyChange = useCallback(
    async (info: EventDropArg | EventResizeDoneArg, isResize: boolean) => {
      const item = info.event.extendedProps as CalendarEvent;
      if (!info.event.start) {
        info.revert();
        return;
      }

      const update = computeDropUpdate(
        {
          item,
          newStart: info.event.start,
          newEnd: info.event.end,
          oldStart: info.oldEvent.start,
          oldEnd: info.oldEvent.end,
          oldAllDay: info.oldEvent.allDay,
          newAllDay: info.event.allDay,
          isResize,
        },
        feeds
      );

      if (update.kind === "blocked") {
        info.revert();
        toast.error(update.reason);
        return;
      }

      try {
        if (update.kind === "task") {
          await updateTask(update.taskId, update.updates);
        } else {
          if (item.isRecurring) {
            setPendingRecurringChange({ info, isResize, update });
            return;
          }
          await saveEventChange({ info, isResize, update });
        }
      } catch (error) {
        console.error("Failed to apply calendar drag change:", error);
        info.revert();
        toast.error(isResize ? "Failed to resize item" : "Failed to move item");
      }
    },
    [feeds, saveEventChange, updateTask]
  );

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      void applyChange(info, false);
    },
    [applyChange]
  );

  const handleEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      void applyChange(info, true);
    },
    [applyChange]
  );

  const cancelRecurringChange = useCallback(() => {
    setPendingRecurringChange((pending) => {
      pending?.info.revert();
      return null;
    });
  }, []);

  const chooseRecurringScope = useCallback(
    (scope: RecurringEventScope) => {
      const pending = pendingRecurringChange;
      if (!pending) return;
      setPendingRecurringChange(null);
      void saveEventChange(pending, scope);
    },
    [pendingRecurringChange, saveEventChange]
  );

  const recurringScopeDialog = createElement(RecurringEventScopeDialog, {
    open: Boolean(pendingRecurringChange),
    action: "change",
    onChoose: chooseRecurringScope,
    onCancel: cancelRecurringChange,
  });

  return { handleEventDrop, handleEventResize, recurringScopeDialog };
}
