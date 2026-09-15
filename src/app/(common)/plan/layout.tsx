import type { Metadata } from "next";

export const metadata: Metadata = { title: "Plan | Sunnie Planner" };

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
