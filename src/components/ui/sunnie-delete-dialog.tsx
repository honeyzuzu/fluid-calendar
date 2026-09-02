"use client";

import { useEffect, useState } from "react";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SunnieDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "event" | "task";
  itemName?: string;
  onConfirm: () => void | Promise<void>;
}

export function SunnieDeleteDialog({
  open,
  onOpenChange,
  itemType,
  itemName,
  onConfirm,
}: SunnieDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setIsDeleting(false);
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : `Sunnie could not delete this ${itemType}. Please try again.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) onOpenChange(nextOpen);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[10020] bg-[#3f432e]/25 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[10021] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#e1dcc4] bg-[#fffdf5] p-5 shadow-[0_22px_60px_rgba(63,67,46,0.22)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f8ddd2] text-[#9b513f]">
              <Trash2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <AlertDialog.Title className="text-lg font-semibold text-[#414530]">
                Delete this {itemType}?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm leading-relaxed text-black/55">
                {itemName ? (
                  <>
                    <span className="font-medium text-[#414530]">
                      “{itemName}”
                    </span>{" "}
                    will be permanently removed
                    {itemType === "event" ? " from its connected calendar" : ""}
                    .
                  </>
                ) : (
                  <>
                    This {itemType} will be permanently removed
                    {itemType === "event" ? " from its connected calendar" : ""}
                    .
                  </>
                )}
              </AlertDialog.Description>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-[#efb7a5] bg-[#fff1e8] px-3 py-2 text-sm text-[#8b4934]"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                Keep {itemType}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault();
                  void handleConfirm();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : `Delete ${itemType}`}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
