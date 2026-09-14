"use client";

import { useEffect, useMemo, useState } from "react";

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  CalendarDays,
  LayoutGrid,
  ListTodo,
  Search,
  Settings,
  X,
  Zap,
} from "lucide-react";

import { cn, formatShortcut } from "@/lib/utils";

import { useCommands } from "@/hooks/useCommands";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [showAllCommands, setShowAllCommands] = useState(false);
  const { searchCommands, executeCommand, getAllCommands } = useCommands();

  // Get filtered commands based on search or show all commands
  const commands = useMemo(() => {
    if (showAllCommands) {
      return getAllCommands();
    }
    return search ? searchCommands(search) : [];
  }, [search, searchCommands, showAllCommands, getAllCommands]);

  // Reset search and showAllCommands when opening/closing
  useEffect(() => {
    if (!open) {
      setSearch("");
      setShowAllCommands(false);
    }
  }, [open]);

  // Group commands by section for better organization
  const groupedCommands = useMemo(() => {
    const groups: Record<string, typeof commands> = {};

    commands.forEach((command) => {
      if (!groups[command.section]) {
        groups[command.section] = [];
      }
      groups[command.section].push(command);
    });

    return groups;
  }, [commands]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-[calc(100vw-1.5rem)] max-w-[640px] -translate-x-1/2">
          <Dialog.Title className="sr-only">Command Menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search commands and navigate the application
          </Dialog.Description>

          <Command
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-[var(--shadow-raised)]",
              "transform transition-all",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <div className="flex items-center border-b px-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Command.Input
                placeholder="Type a command or search..."
                className="h-12 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
                value={search}
                onValueChange={setSearch}
              />
              {search && (
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {!search && (
                <kbd className="hidden items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:flex">
                  <span className="text-xs">⌘</span>
                  <span>K</span>
                </kbd>
              )}
              <Dialog.Close
                className="ml-2 p-2 text-muted-foreground hover:text-foreground"
                aria-label="Close command menu"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              {!search && !showAllCommands && (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  <p className="mb-2">
                    Start typing to search commands or try these:
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 text-left hover:bg-muted"
                      onClick={() => {
                        executeCommand("navigation.calendar");
                        onOpenChange(false);
                      }}
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Go to Calendar</span>
                      <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">
                        gc
                      </kbd>
                    </button>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 text-left hover:bg-muted"
                      onClick={() => {
                        executeCommand("navigation.tasks");
                        onOpenChange(false);
                      }}
                    >
                      <ListTodo className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Go to Tasks</span>
                      <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">
                        gt
                      </kbd>
                    </button>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 text-left hover:bg-muted"
                      onClick={() => {
                        executeCommand("navigation.focus");
                        onOpenChange(false);
                      }}
                    >
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Go to Focus</span>
                      <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">
                        gf
                      </kbd>
                    </button>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-2 text-left hover:bg-muted"
                      onClick={() => {
                        executeCommand("navigation.settings");
                        onOpenChange(false);
                      }}
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Go to Settings</span>
                      <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">
                        gs
                      </kbd>
                    </button>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setShowAllCommands(true)}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Show all commands
                    </button>
                  </div>
                </div>
              )}

              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found. Try a different search term.
              </Command.Empty>

              {(commands.length > 0 || showAllCommands) &&
                Object.entries(groupedCommands).map(
                  ([section, sectionCommands]) => (
                    <Command.Group
                      key={section}
                      heading={
                        section.charAt(0).toUpperCase() + section.slice(1)
                      }
                    >
                      {sectionCommands.map((command) => {
                        const Icon = command.icon;
                        return (
                          <Command.Item
                            key={command.id}
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm aria-selected:bg-accent/35 aria-selected:text-accent-foreground"
                            onSelect={() => {
                              executeCommand(command.id);
                              onOpenChange(false);
                            }}
                          >
                            {Icon && <Icon className="h-4 w-4" />}
                            <span>{command.title}</span>
                            {command.shortcut && (
                              <kbd className="ml-auto text-xs text-muted-foreground">
                                {formatShortcut(command.shortcut)}
                              </kbd>
                            )}
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  )
                )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
