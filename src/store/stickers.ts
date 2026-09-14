import { create } from "zustand";

import { findStickerAsset } from "@/lib/sticker-manifest";
import type { StickerAsset } from "@/lib/sticker-manifest";

import type {
  CalendarSticker,
  CalendarStickerUpdate,
  NewCalendarSticker,
} from "@/types/calendar-sticker";

type StickerSelection = { packId: string; asset: StickerAsset };
type UndoAction =
  | { kind: "delete"; sticker: CalendarSticker }
  | { kind: "update"; sticker: CalendarSticker };

type StickerStore = {
  stickers: CalendarSticker[];
  selectedAsset: StickerSelection | null;
  selectedStickerId: string | null;
  isEditing: boolean;
  loadedRanges: string[];
  loading: boolean;
  error: string | null;
  undoAction: UndoAction | null;
  loadRange: (start: Date, end: Date) => Promise<void>;
  selectAsset: (selection: StickerSelection | null) => void;
  selectSticker: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  placeSticker: (input: NewCalendarSticker) => Promise<CalendarSticker>;
  updateSticker: (
    id: string,
    updates: CalendarStickerUpdate
  ) => Promise<CalendarSticker>;
  deleteSticker: (id: string) => Promise<void>;
  undoLast: () => Promise<void>;
};

const stickerRangeRequests = new Map<string, Promise<void>>();

const dateKey = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const rangeKey = (start: Date, end: Date) =>
  `${dateKey(start)}:${dateKey(end)}`;

async function readResponse<Value>(response: Response): Promise<Value> {
  const body = (await response.json().catch(() => null)) as
    | (Value & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return body as Value;
}

export const useStickerStore = create<StickerStore>((set, get) => ({
  stickers: [],
  selectedAsset: null,
  selectedStickerId: null,
  isEditing: false,
  loadedRanges: [],
  loading: false,
  error: null,
  undoAction: null,

  loadRange: async (start, end) => {
    const key = rangeKey(start, end);
    if (get().loadedRanges.includes(key)) return;
    const inFlight = stickerRangeRequests.get(key);
    if (inFlight) return inFlight;

    const request = (async () => {
      set({ loading: true, error: null });
      try {
        const params = new URLSearchParams({
          start: dateKey(start),
          end: dateKey(end),
        });
        const visible = await fetch(`/api/calendar-stickers?${params}`).then(
          (response) => readResponse<CalendarSticker[]>(response)
        );
        const visibleIds = new Set(visible.map(({ id }) => id));
        set((state) => ({
          stickers: [
            ...state.stickers.filter(
              (sticker) =>
                visibleIds.has(sticker.id) ||
                sticker.anchorDate < dateKey(start) ||
                sticker.anchorDate >= dateKey(end)
            ),
            ...visible.filter(
              (sticker) =>
                !state.stickers.some((current) => current.id === sticker.id)
            ),
          ].map(
            (sticker) =>
              visible.find((item) => item.id === sticker.id) ?? sticker
          ),
          loadedRanges: [...state.loadedRanges.slice(-7), key],
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        stickerRangeRequests.delete(key);
        set({ loading: false });
      }
    })();
    stickerRangeRequests.set(key, request);
    return request;
  },

  selectAsset: (selectedAsset) =>
    set({ selectedAsset, selectedStickerId: null, isEditing: !!selectedAsset }),
  selectSticker: (selectedStickerId) =>
    set({ selectedStickerId, selectedAsset: null }),
  setEditing: (isEditing) =>
    set(
      isEditing
        ? { isEditing: true }
        : { isEditing: false, selectedAsset: null, selectedStickerId: null }
    ),

  placeSticker: async (input) => {
    const asset = findStickerAsset(input.packId, input.stickerId);
    if (!asset) throw new Error("Sticker asset not found");
    const temporaryId = `temporary:${crypto.randomUUID()}`;
    const optimistic: CalendarSticker = {
      ...input,
      id: temporaryId,
      view: "month",
      scale: input.scale ?? asset.defaultScale,
      rotation: input.rotation ?? 0,
      zIndex: input.zIndex ?? 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      stickers: [...state.stickers, optimistic],
      selectedStickerId: temporaryId,
      selectedAsset: null,
      error: null,
    }));
    try {
      const saved = await fetch("/api/calendar-stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimistic),
      }).then((response) => readResponse<CalendarSticker>(response));
      set((state) => ({
        stickers: state.stickers.map((sticker) =>
          sticker.id === temporaryId ? saved : sticker
        ),
        selectedStickerId:
          state.selectedStickerId === temporaryId
            ? saved.id
            : state.selectedStickerId,
        undoAction: { kind: "delete", sticker: saved },
      }));
      return saved;
    } catch (error) {
      set((state) => ({
        stickers: state.stickers.filter(({ id }) => id !== temporaryId),
        selectedStickerId: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },

  updateSticker: async (id, updates) => {
    const previous = get().stickers.find((sticker) => sticker.id === id);
    if (!previous) throw new Error("Sticker not found");
    set((state) => ({
      stickers: state.stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, ...updates } : sticker
      ),
      error: null,
      undoAction: { kind: "update", sticker: previous },
    }));
    try {
      const saved = await fetch(`/api/calendar-stickers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((response) => readResponse<CalendarSticker>(response));
      set((state) => ({
        stickers: state.stickers.map((sticker) =>
          sticker.id === id ? saved : sticker
        ),
      }));
      return saved;
    } catch (error) {
      set((state) => ({
        stickers: state.stickers.map((sticker) =>
          sticker.id === id ? previous : sticker
        ),
        undoAction: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },

  deleteSticker: async (id) => {
    const previous = get().stickers.find((sticker) => sticker.id === id);
    if (!previous) return;
    set((state) => ({
      stickers: state.stickers.filter((sticker) => sticker.id !== id),
      selectedStickerId:
        state.selectedStickerId === id ? null : state.selectedStickerId,
      error: null,
    }));
    try {
      await fetch(`/api/calendar-stickers/${id}`, { method: "DELETE" }).then(
        (response) => readResponse<{ success: true }>(response)
      );
    } catch (error) {
      set((state) => ({
        stickers: [...state.stickers, previous],
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },

  undoLast: async () => {
    const action = get().undoAction;
    if (!action) return;
    set({ undoAction: null });
    if (action.kind === "delete") {
      const previous = get().stickers;
      set((state) => ({
        stickers: state.stickers.filter(
          (sticker) => sticker.id !== action.sticker.id
        ),
        selectedStickerId: null,
      }));
      try {
        await fetch(`/api/calendar-stickers/${action.sticker.id}`, {
          method: "DELETE",
        }).then((response) => readResponse<{ success: true }>(response));
      } catch (error) {
        set({
          stickers: previous,
          undoAction: action,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
      return;
    }

    const current = get().stickers.find(
      (sticker) => sticker.id === action.sticker.id
    );
    if (!current) return;
    set((state) => ({
      stickers: state.stickers.map((sticker) =>
        sticker.id === action.sticker.id ? action.sticker : sticker
      ),
    }));
    try {
      const saved = await fetch(`/api/calendar-stickers/${action.sticker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchorDate: action.sticker.anchorDate,
          x: action.sticker.x,
          y: action.sticker.y,
          scale: action.sticker.scale,
          rotation: action.sticker.rotation,
          zIndex: action.sticker.zIndex,
        }),
      }).then((response) => readResponse<CalendarSticker>(response));
      set((state) => ({
        stickers: state.stickers.map((sticker) =>
          sticker.id === saved.id ? saved : sticker
        ),
      }));
    } catch (error) {
      set((state) => ({
        stickers: state.stickers.map((sticker) =>
          sticker.id === current.id ? current : sticker
        ),
        undoAction: action,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      throw error;
    }
  },
}));
