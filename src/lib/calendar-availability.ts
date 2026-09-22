/** A provider's Free/transparent event is visible on Calendar but does not
 * reserve time for scheduling or daily capacity. */
export function blocksCalendarTime(event: {
  isFree?: boolean | null;
  status?: string | null;
}) {
  const status = event.status?.toLowerCase();
  return !event.isFree && status !== "cancelled" && status !== "canceled";
}
