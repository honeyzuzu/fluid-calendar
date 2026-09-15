"use client";

import { useState } from "react";

import { ListTodo, Plus, Search, Sparkles } from "lucide-react";

import { TaskModal } from "@/components/tasks/TaskModal";

export default function TaskModalPreviewPage() {
  const [open, setOpen] = useState(true);

  return (
    <main
      data-discord-preview-ready
      className="min-h-screen bg-background p-4 text-foreground sm:p-8"
    >
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-border bg-card/80 p-5 shadow-[var(--shadow-paper)]">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Little things, lovingly
              planned
            </p>
            <h1 className="mt-1 text-3xl font-bold">Tasks</h1>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Create task
          </button>
        </header>
        <section className="mt-5 rounded-3xl border border-border bg-card/70 p-4 shadow-[var(--shadow-paper)]">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> Search tasks…
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Plan the weekend", "Call the dentist", "Water the herbs"].map(
              (title) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <ListTodo className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{title}</span>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      <TaskModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={async () => undefined}
        tags={[
          { id: "home", name: "Home", color: "#83a46a" },
          { id: "errands", name: "Errands", color: "#d89c62" },
        ]}
        onCreateTag={async (name, color) => ({
          id: name.toLowerCase().replaceAll(" ", "-"),
          name,
          color,
        })}
      />
    </main>
  );
}
