import type { Metadata } from "next";

export const metadata: Metadata = { title: "Focus | Sunnie Planner" };

export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
