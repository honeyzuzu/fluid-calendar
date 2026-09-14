"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";

import { Trash2 } from "lucide-react";
import Moveable from "react-moveable";
import { toast } from "sonner";

import { findStickerAsset } from "@/lib/sticker-manifest";
import { cn } from "@/lib/utils";

import { useStickerStore } from "@/store/stickers";

import type { CalendarSticker } from "@/types/calendar-sticker";

type LiveTransform = {
  translateX: number;
  translateY: number;
  scale: number;
  rotation: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function StickerOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const targetRefs = useRef(new Map<string, HTMLDivElement>());
  const liveTransform = useRef<LiveTransform>({
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotation: 0,
  });
  const [geometryRevision, setGeometryRevision] = useState(0);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const {
    stickers,
    selectedStickerId,
    isEditing,
    selectSticker,
    updateSticker,
    deleteSticker,
  } = useStickerStore();

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const refresh = () => setGeometryRevision((revision) => revision + 1);
    const observer = new ResizeObserver(refresh);
    observer.observe(overlay);
    const calendar = overlay.previousElementSibling;
    if (calendar instanceof HTMLElement) observer.observe(calendar);
    window.addEventListener("resize", refresh);
    requestAnimationFrame(refresh);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
    };
  }, []);

  useEffect(() => {
    setTarget(
      selectedStickerId
        ? (targetRefs.current.get(selectedStickerId) ?? null)
        : null
    );
  }, [geometryRevision, selectedStickerId, stickers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedStickerId) return;
      const selected = stickers.find(({ id }) => id === selectedStickerId);
      if (!selected || selected.id.startsWith("temporary:")) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        void remove(selected.id);
        return;
      }
      const delta = event.shiftKey ? 0.1 : 0.025;
      const movement = {
        ArrowLeft: { x: -delta, y: 0 },
        ArrowRight: { x: delta, y: 0 },
        ArrowUp: { x: 0, y: -delta },
        ArrowDown: { x: 0, y: delta },
      }[event.key];
      if (!movement) return;
      event.preventDefault();
      void updateSticker(selected.id, {
        x: clamp(selected.x + movement.x, 0, 1),
        y: clamp(selected.y + movement.y, 0, 1),
      }).catch(() => toast.error("That sticker snapped back"));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const positioned = useMemo(() => {
    const overlay = overlayRef.current;
    if (!overlay) return [];
    const overlayRect = overlay.getBoundingClientRect();
    return stickers.flatMap((sticker) => {
      const cell = overlay.parentElement?.querySelector<HTMLElement>(
        `.fc-daygrid-day[data-date="${sticker.anchorDate}"]`
      );
      if (!cell) return [];
      const cellRect = cell.getBoundingClientRect();
      return [
        {
          sticker,
          left: cellRect.left - overlayRect.left + cellRect.width * sticker.x,
          top: cellRect.top - overlayRect.top + cellRect.height * sticker.y,
        },
      ];
    });
    // The revision deliberately invalidates geometry after ResizeObserver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometryRevision, stickers]);

  const applyTransform = (element: HTMLElement, transform: LiveTransform) => {
    element.style.transform = `translate(-50%, -50%) translate(${transform.translateX}px, ${transform.translateY}px) rotate(${transform.rotation}deg) scale(${transform.scale})`;
  };

  const persistTransform = async (
    sticker: CalendarSticker,
    element: HTMLElement,
    transform: LiveTransform
  ) => {
    const overlay = overlayRef.current;
    if (!overlay || sticker.id.startsWith("temporary:")) return;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const cells = Array.from(
      overlay.parentElement?.querySelectorAll<HTMLElement>(
        ".fc-daygrid-day[data-date]"
      ) ?? []
    );
    const cell =
      cells.find((candidate) => {
        const candidateRect = candidate.getBoundingClientRect();
        return (
          centerX >= candidateRect.left &&
          centerX <= candidateRect.right &&
          centerY >= candidateRect.top &&
          centerY <= candidateRect.bottom
        );
      }) ??
      cells.reduce<HTMLElement | null>((closest, candidate) => {
        if (!closest) return candidate;
        const distance = (item: HTMLElement) => {
          const candidateRect = item.getBoundingClientRect();
          const x = clamp(centerX, candidateRect.left, candidateRect.right);
          const y = clamp(centerY, candidateRect.top, candidateRect.bottom);
          return Math.hypot(centerX - x, centerY - y);
        };
        return distance(candidate) < distance(closest) ? candidate : closest;
      }, null);
    if (!cell?.dataset.date) return;
    const cellRect = cell.getBoundingClientRect();
    try {
      await updateSticker(sticker.id, {
        anchorDate: cell.dataset.date,
        x: clamp((centerX - cellRect.left) / cellRect.width, 0, 1),
        y: clamp((centerY - cellRect.top) / cellRect.height, 0, 1),
        scale: clamp(transform.scale, 0.4, 2.5),
        rotation: transform.rotation,
      });
    } catch {
      toast.error("That sticker snapped back", {
        description: "Sunnie couldn't save its new position.",
      });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteSticker(id);
    } catch {
      toast.error("Sunnie couldn't remove that sticker", {
        description: "It has been restored.",
      });
    }
  };

  const selectedSticker = stickers.find(({ id }) => id === selectedStickerId);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      aria-label="Calendar stickers"
    >
      {positioned.map(({ sticker, left, top }) => {
        const asset = findStickerAsset(sticker.packId, sticker.stickerId);
        if (!asset) return null;
        const selected = sticker.id === selectedStickerId;
        return (
          <div
            key={`${sticker.id}:${sticker.anchorDate}:${sticker.x}:${sticker.y}:${sticker.scale}:${sticker.rotation}`}
            ref={(element) => {
              if (element) targetRefs.current.set(sticker.id, element);
              else targetRefs.current.delete(sticker.id);
            }}
            data-calendar-sticker={sticker.id}
            className={cn(
              "pointer-events-auto absolute h-14 w-14 touch-none rounded-lg outline-none",
              !isEditing && !selected && "pointer-events-none",
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-card"
            )}
            style={{
              left,
              top,
              zIndex: sticker.zIndex,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                selectSticker(sticker.id);
              }}
              aria-label={`${asset.label} sticker. Select to move, resize, rotate, or delete.`}
              className="grid h-full w-full place-items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Image
                src={asset.src}
                alt=""
                width={64}
                height={64}
                draggable={false}
                className="h-14 w-14 select-none object-contain drop-shadow-sm"
              />
            </button>
            {selected && !sticker.id.startsWith("temporary:") && (
              <button
                type="button"
                aria-label={`Delete ${asset.label} sticker`}
                onClick={(event) => {
                  event.stopPropagation();
                  void remove(sticker.id);
                }}
                className="absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-destructive shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {target &&
        selectedSticker &&
        !selectedSticker.id.startsWith("temporary:") && (
          <Moveable
            target={target}
            container={overlayRef.current}
            draggable
            scalable
            rotatable
            keepRatio
            origin={false}
            renderDirections={["nw", "ne", "sw", "se"]}
            rotationPosition="top"
            onDragStart={({ set }) => {
              liveTransform.current = {
                translateX: 0,
                translateY: 0,
                scale: selectedSticker.scale,
                rotation: selectedSticker.rotation,
              };
              set([0, 0]);
            }}
            onDrag={({ target: element, translate }) => {
              liveTransform.current.translateX = translate[0];
              liveTransform.current.translateY = translate[1];
              applyTransform(element as HTMLElement, liveTransform.current);
            }}
            onDragEnd={({ target: element }) =>
              void persistTransform(
                selectedSticker,
                element as HTMLElement,
                liveTransform.current
              )
            }
            onScaleStart={({ set }) => {
              liveTransform.current = {
                translateX: 0,
                translateY: 0,
                scale: selectedSticker.scale,
                rotation: selectedSticker.rotation,
              };
              set([selectedSticker.scale, selectedSticker.scale]);
            }}
            onScale={({ target: element, scale, drag }) => {
              liveTransform.current.scale = clamp(scale[0], 0.4, 2.5);
              liveTransform.current.translateX = drag.beforeTranslate[0];
              liveTransform.current.translateY = drag.beforeTranslate[1];
              applyTransform(element as HTMLElement, liveTransform.current);
            }}
            onScaleEnd={({ target: element }) =>
              void persistTransform(
                selectedSticker,
                element as HTMLElement,
                liveTransform.current
              )
            }
            onRotateStart={({ set }) => {
              liveTransform.current = {
                translateX: 0,
                translateY: 0,
                scale: selectedSticker.scale,
                rotation: selectedSticker.rotation,
              };
              set(selectedSticker.rotation);
            }}
            onRotate={({ target: element, beforeRotate, drag }) => {
              liveTransform.current.rotation = beforeRotate;
              liveTransform.current.translateX = drag.beforeTranslate[0];
              liveTransform.current.translateY = drag.beforeTranslate[1];
              applyTransform(element as HTMLElement, liveTransform.current);
            }}
            onRotateEnd={({ target: element }) =>
              void persistTransform(
                selectedSticker,
                element as HTMLElement,
                liveTransform.current
              )
            }
          />
        )}
    </div>
  );
}
