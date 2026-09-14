import { Plus } from "lucide-react";

import { useTaskModalStore } from "@/store/taskModal";

import { Command } from "../types";

export function useTaskCommands(): Command[] {
  return [
    {
      id: "tasks.create",
      title: "Create Task",
      keywords: ["task", "new", "add", "create"],
      icon: Plus,
      section: "tasks",
      shortcut: "nt", // 'n' for new, 't' for task
      context: {
        navigateIfNeeded: true,
        requiredPath: "/tasks",
      },
      perform: () => {
        useTaskModalStore.getState().setOpen(true);
      },
    },
  ];
}
