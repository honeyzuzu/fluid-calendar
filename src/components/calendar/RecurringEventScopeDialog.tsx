"use client";

import { useEffect, useState } from "react";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { Button } from "@/components/ui/button";

export type RecurringEventScope = "single" | "series";

interface RecurringEventScopeDialogProps {
  open: boolean;
  action: "change" | "delete";
  testIdPrefix?: "change" | "delete" | "edit";
  onChoose: (scope: RecurringEventScope) => void | Promise<void>;
  onCancel: () => void;
}

export function RecurringEventScopeDialog({
  open,
  action,
  testIdPrefix = action,
  onChoose,
  onCancel,
}: RecurringEventScopeDialogProps) {
  const deleting = action === "delete";
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setIsWorking(false);
      setError(null);
    }
  }, [open]);

  const handleChoose = async (scope: RecurringEventScope) => {
    setIsWorking(true);
    setError(null);
    try {
      await onChoose(scope);
    } catch (choiceError) {
      setError(
        choiceError instanceof Error
          ? choiceError.message
          : `Sunnie could not ${action} this recurring event.`
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isWorking) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[10001] bg-background/80 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[10002] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg">
          <AlertDialog.Title className="text-lg font-semibold">
            {deleting ? "Delete recurring event?" : "Change recurring event?"}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            Choose whether to {action} only this occurrence or the repeating
            schedule from this day forward.
          </AlertDialog.Description>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={isWorking}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant={deleting ? "destructive" : "outline"}
              onClick={() => void handleChoose("single")}
              disabled={isWorking}
              data-testid={`${testIdPrefix}-single-event-button`}
            >
              Only this event
            </Button>
            <Button
              type="button"
              variant={deleting ? "destructive" : "default"}
              onClick={() => void handleChoose("series")}
              disabled={isWorking}
              data-testid={`${testIdPrefix}-series-button`}
            >
              This and future events
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
