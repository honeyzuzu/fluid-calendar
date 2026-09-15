import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks | Sunnie Planner" };

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
