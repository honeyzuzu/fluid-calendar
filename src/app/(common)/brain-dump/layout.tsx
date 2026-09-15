import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks | Sunnie Planner" };

export default function BrainDumpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
