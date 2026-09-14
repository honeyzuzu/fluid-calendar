import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import {
  CalendarDays,
  ClipboardCheck,
  NotebookTabs,
  Settings,
  Timer,
} from "lucide-react";

import { Command } from "../types";

export function useNavigationCommands(): Command[] {
  return [
    {
      id: "navigation.plan",
      title: "Go to Plan",
      keywords: ["navigation", "today", "week", "review"],
      icon: NotebookTabs,
      section: "navigation",
      shortcut: "gp",
      perform: (router?: AppRouterInstance) => {
        if (router) router.push("/plan");
      },
    },
    {
      id: "navigation.calendar",
      title: "Go to Calendar",
      keywords: ["navigation"],
      icon: CalendarDays,
      section: "navigation",
      shortcut: "gc",
      perform: (router?: AppRouterInstance) => {
        if (router) router.push("/calendar");
      },
    },
    {
      id: "navigation.tasks",
      title: "Go to Tasks",
      keywords: ["navigation"],
      icon: ClipboardCheck,
      section: "navigation",
      shortcut: "gt",
      perform: (router?: AppRouterInstance) => {
        if (router) router.push("/tasks");
      },
    },
    {
      id: "navigation.focus",
      title: "Go to Focus",
      keywords: ["navigation"],
      icon: Timer,
      section: "navigation",
      shortcut: "gf",
      perform: (router?: AppRouterInstance) => {
        if (router) router.push("/focus");
      },
    },
    {
      id: "navigation.settings",
      title: "Go to Settings",
      keywords: ["navigation"],
      icon: Settings,
      section: "navigation",
      shortcut: "gs",
      perform: (router?: AppRouterInstance) => {
        if (router) router.push("/settings");
      },
    },
  ];
}
