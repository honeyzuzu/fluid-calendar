export interface SunnieEventColor {
  name: string;
  value: string;
}

export interface SunnieEventColorGroup {
  name: string;
  colors: readonly SunnieEventColor[];
}

export const SUNNIE_EVENT_COLOR_GROUPS: readonly SunnieEventColorGroup[] = [
  {
    name: "Sky & twilight",
    colors: [
      { name: "Cloud Blue", value: "#9BC7D9" },
      { name: "Soft Denim", value: "#7397C7" },
      { name: "Periwinkle", value: "#A7ACE0" },
      { name: "Twilight", value: "#807CB7" },
    ],
  },
  {
    name: "Sea & garden",
    colors: [
      { name: "Sea Glass", value: "#78B8B3" },
      { name: "Deep Teal", value: "#4F8F91" },
      { name: "Dusty Sage", value: "#7F9B83" },
      { name: "Pine Mist", value: "#668779" },
    ],
  },
  {
    name: "Sunset & earth",
    colors: [
      { name: "Apricot", value: "#E9A66F" },
      { name: "Soft Tangerine", value: "#DF8F5E" },
      { name: "Clay", value: "#C98772" },
      { name: "Cocoa Mauve", value: "#9B7A86" },
    ],
  },
] as const;

export const SUNNIE_PASTEL_COLORS: readonly SunnieEventColor[] =
  SUNNIE_EVENT_COLOR_GROUPS.flatMap((group) => group.colors);
