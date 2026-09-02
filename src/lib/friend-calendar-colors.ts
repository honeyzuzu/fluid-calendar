export const DEFAULT_FRIEND_CALENDAR_COLOR = "#D7CBEA";

export const FRIEND_CALENDAR_COLORS = [
  { name: "Lavender mist", value: "#D7CBEA" },
  { name: "Powder blue", value: "#C6DCEB" },
  { name: "Blush cloud", value: "#EBCBD7" },
  { name: "Peach cream", value: "#F0D0B7" },
  { name: "Misty teal", value: "#C5DEDA" },
  { name: "Periwinkle", value: "#CBD1EE" },
] as const;

export function getFriendCalendarColor(
  friendId: string,
  colors: Record<string, string>
) {
  return colors[friendId] || DEFAULT_FRIEND_CALENDAR_COLOR;
}
