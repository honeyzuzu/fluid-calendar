import { SunnieSkeleton } from "@/components/ui/sunnie";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="min-h-full w-full min-w-0 overflow-hidden bg-background px-3 py-5 min-[380px]:px-4 sm:px-5 lg:p-8"
    >
      <span className="sr-only">Loading page…</span>
      <div className="mx-auto w-full max-w-[1440px] space-y-5">
        <header className="rounded-[var(--radius-hero)] border border-border bg-card/70 p-5 shadow-[var(--shadow-paper)] sm:p-6">
          <SunnieSkeleton className="h-3 w-32" />
          <SunnieSkeleton className="mt-4 h-9 w-[min(34rem,78%)]" />
          <SunnieSkeleton className="mt-3 h-4 w-[min(26rem,60%)]" />
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <section className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card/75 p-4 shadow-[var(--shadow-paper)] sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <SunnieSkeleton className="h-5 w-40" />
                <SunnieSkeleton className="h-3 w-64 max-w-full" />
              </div>
              <SunnieSkeleton className="h-9 w-24" />
            </div>
            <SunnieSkeleton className="h-12 w-full" />
            <SunnieSkeleton className="h-24 w-full" />
            <SunnieSkeleton className="h-24 w-full" />
          </section>

          <aside className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card/70 p-4 shadow-[var(--shadow-paper)] sm:p-5">
            <SunnieSkeleton className="h-5 w-32" />
            <SunnieSkeleton className="h-12 w-full" />
            <SunnieSkeleton className="h-12 w-full" />
            <SunnieSkeleton className="h-32 w-full" />
          </aside>
        </div>
      </div>
    </div>
  );
}
