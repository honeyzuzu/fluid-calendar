"use client";

import { useState } from "react";

import Image from "next/image";

import {
  Check,
  Minus,
  Plus,
  RotateCw,
  Sticker,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { SunniePanel } from "@/components/ui/sunnie";

import {
  SUNNIE_BASICS_STICKER_PACK,
  THEME_STICKER_PACKS,
} from "@/lib/sticker-manifest";
import { cn } from "@/lib/utils";

import { useStickerStore } from "@/store/stickers";

type StickerBookTab = "theme" | "basics";

export function StickerBook() {
  const { colorTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<StickerBookTab>("theme");
  const {
    selectedAsset,
    selectedStickerId,
    stickers,
    selectAsset,
    undoAction,
    undoLast,
    isEditing,
    setEditing,
    updateSticker,
    deleteSticker,
  } = useStickerStore();
  const themePack = THEME_STICKER_PACKS[colorTheme.id];
  const activePack = tab === "theme" ? themePack : SUNNIE_BASICS_STICKER_PACK;
  const selectedSticker = stickers.find(({ id }) => id === selectedStickerId);

  const undo = async () => {
    try {
      await undoLast();
    } catch {
      toast.error("Sunnie couldn't undo that sticker change");
    }
  };

  const adjustSelected = async (updates: {
    scale?: number;
    rotation?: number;
  }) => {
    if (!selectedSticker || selectedSticker.id.startsWith("temporary:")) return;
    try {
      await updateSticker(selectedSticker.id, updates);
    } catch {
      toast.error("That sticker snapped back");
    }
  };

  const removeSelected = async () => {
    if (!selectedSticker || selectedSticker.id.startsWith("temporary:")) return;
    try {
      await deleteSticker(selectedSticker.id);
    } catch {
      toast.error("Sunnie couldn't remove that sticker");
    }
  };

  return (
    <>
      {isEditing &&
        selectedSticker &&
        !selectedSticker.id.startsWith("temporary:") && (
          <div
            className="absolute bottom-16 right-3 z-30 flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-[var(--shadow-raised)]"
            aria-label="Selected sticker controls"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Make sticker smaller"
              className="h-9 w-9"
              onClick={() =>
                void adjustSelected({
                  scale: Math.max(0.4, selectedSticker.scale - 0.15),
                })
              }
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Make sticker larger"
              className="h-9 w-9"
              onClick={() =>
                void adjustSelected({
                  scale: Math.min(2.5, selectedSticker.scale + 0.15),
                })
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Rotate sticker clockwise"
              className="h-9 w-9"
              onClick={() =>
                void adjustSelected({ rotation: selectedSticker.rotation + 15 })
              }
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete selected sticker"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => void removeSelected()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
        {undoAction && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void undo()}
            className="bg-card/95"
          >
            <Undo2 className="mr-1.5 h-4 w-4" /> Undo
          </Button>
        )}
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(false)}
            className="bg-card/95"
          >
            <Check className="mr-1.5 h-4 w-4" /> Done
          </Button>
        )}
        <Button
          type="button"
          onClick={() => {
            setEditing(true);
            setOpen(true);
          }}
          className="shadow-[var(--shadow-raised)]"
          aria-label="Open Sticker Book"
        >
          <Sticker className="mr-2 h-4 w-4" /> Sticker Book
        </Button>
      </div>

      {selectedAsset && (
        <div
          role="status"
          className="pointer-events-auto absolute left-1/2 top-3 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-xs font-semibold shadow-[var(--shadow-raised)]"
        >
          <Image src={selectedAsset.asset.src} alt="" width={24} height={24} />
          <span className="truncate">
            Tap a day to place {selectedAsset.asset.label}
          </span>
          <button
            type="button"
            onClick={() => selectAsset(null)}
            aria-label="Cancel sticker placement"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close Sticker Book"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[79] bg-foreground/20 backdrop-blur-[1px]"
          />
          <SunniePanel
            radius="dialog"
            elevation="raised"
            className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[80] max-h-[65dvh] overflow-y-auto sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[25rem] lg:bottom-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Bujo decorations
                </p>
                <h2 className="text-lg font-bold">Sticker Book</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick one, then tap a day. Placed stickers stay when themes
                  change.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Sticker Book"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(["theme", "basics"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-semibold",
                    tab === item
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {item === "theme" ? "Theme" : "Basics"}
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs font-bold text-secondary-foreground">
              {activePack.label}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {activePack.assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    selectAsset({ packId: activePack.id, asset });
                    setOpen(false);
                  }}
                  className="group rounded-xl border border-border bg-card p-2 text-center transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[var(--shadow-paper)]"
                >
                  <Image
                    src={asset.src}
                    alt=""
                    width={64}
                    height={64}
                    className="mx-auto h-14 w-14 object-contain"
                  />
                  <span className="mt-1 block truncate text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                    {asset.label}
                  </span>
                </button>
              ))}
            </div>
          </SunniePanel>
        </>
      )}
    </>
  );
}
