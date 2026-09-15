import type { Metadata } from "next";

export const metadata: Metadata = { title: "Friends | Sunnie Planner" };

export default function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
