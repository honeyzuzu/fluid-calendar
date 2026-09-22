import { readFileSync } from "fs";
import path from "path";

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

it("offers an explicit scope before changing or deleting recurring events", () => {
  const dialog = source(
    "src/components/calendar/RecurringEventScopeDialog.tsx"
  );
  const dragHandlers = source(
    "src/components/calendar/useCalendarDragHandlers.ts"
  );
  const eventModal = source("src/components/calendar/EventModal.tsx");
  const quickView = source("src/components/calendar/EventQuickView.tsx");

  expect(dialog).toContain("Only this event");
  expect(dialog).toContain("This and future events");
  expect(dragHandlers).toContain("item.isRecurring");
  expect(dragHandlers).toContain("setPendingRecurringChange");
  expect(eventModal).toContain("setShowRecurrenceDialog(true)");
  expect(quickView).toContain("eventItem?.isRecurring");
  expect(quickView).toContain('action="delete"');
});
