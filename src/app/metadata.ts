import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sunnie Planner",
  description: "A calm daily planner and shared calendar for friends",
  icons: {
    icon: [
      { url: "/sunnie-sun.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/sunnie-sun.svg", type: "image/svg+xml", sizes: "64x64" },
    ],
    apple: [
      { url: "/sunnie-sun.svg", type: "image/svg+xml", sizes: "180x180" },
    ],
  },
};
