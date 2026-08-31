"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Github,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UsersRound,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAppVersion, getVersionGithubUrl } from "@/lib/version";

function SunMark({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center rounded-full bg-[#f8c95d] text-[#77591d] shadow-[0_5px_0_#e6ae3e] ${small ? "h-9 w-9" : "h-20 w-20"}`}
    >
      <SunMedium className={small ? "h-6 w-6" : "h-14 w-14"} strokeWidth={1.8} />
      {!small && (
        <span className="absolute top-[31px] flex gap-4">
          <span className="h-1.5 w-1.5 rounded-full bg-[#77591d]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#77591d]" />
        </span>
      )}
      {!small && <span className="absolute top-[43px] h-2 w-4 rounded-b-full border-b-2 border-[#77591d]" />}
    </span>
  );
}

export default function SunnieLanding() {
  const { data: session } = useSession();
  const router = useRouter();
  const enterApp = () => router.push(session ? "/plan" : "/auth/signin");

  return (
    <div className="relative isolate min-h-[100dvh] overflow-x-clip bg-[#fff9e8] text-[#3f432e]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-36 h-72 w-72 rounded-full bg-[#f7d96f]/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-12 h-96 w-96 rounded-full bg-[#b8d98b]/30 blur-3xl" />

      <header className="relative z-10 border-b border-[#6e744f]/10 bg-[#fff9e8]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Sunnie Planner home">
            <SunMark small />
            <span className="text-lg font-bold tracking-[-0.03em]">Sunnie Planner</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="https://github.com/dotnetfactory/fluid-calendar" target="_blank" className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#626849] hover:bg-[#f1eccf] sm:flex">
              <Github className="h-4 w-4" /> Open source
            </Link>
            <button onClick={enterApp} className="rounded-full bg-[#64734a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_0_#465331] transition hover:-translate-y-0.5 hover:bg-[#596841]">
              {session ? "Open planner" : "Sign in"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-[1]">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.03fr_0.97fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="mb-7 flex items-center gap-4">
              <SunMark />
              <span className="rotate-[-2deg] rounded-full bg-[#e6f0cf] px-4 py-2 text-sm font-semibold text-[#607044] shadow-sm">A softer way to plan together</span>
            </div>
            <h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.065em] text-[#3b432e] sm:text-6xl lg:text-7xl">
              Make your days feel <span className="relative whitespace-nowrap text-[#d5912d]">sunnier.<span aria-hidden="true" className="absolute -bottom-2 left-1 right-0 h-2 rounded-full bg-[#f4cf69]/60" /></span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#656a50]">
              Bring your tasks, calendar, and favorite people into one calm daily plan. See when friends are free without giving up your privacy.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={enterApp} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e9ae43] px-6 py-4 font-bold text-[#493916] shadow-[0_6px_0_#c88d2b] transition hover:-translate-y-1 hover:bg-[#f0b84e]">
                {session ? "Plan my day" : "Start planning"}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <Link href="#how-it-helps" className="inline-flex items-center justify-center rounded-2xl border border-[#7a805d]/20 bg-white/60 px-6 py-4 font-semibold text-[#596044] hover:bg-white">See how it helps</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#6d7258]">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#789d52]" />Self-hosted</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#789d52]" />Private by default</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#789d52]" />Made for friends</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div aria-hidden="true" className="absolute -inset-5 rotate-2 rounded-[2.5rem] bg-[#dceabf]" />
            <div className="relative rounded-[2rem] border border-[#657049]/10 bg-[#fffdf5] p-4 shadow-[0_24px_70px_rgba(89,94,54,0.16)] sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d0902f]">Good morning, Sunnie</p><h2 className="mt-1 text-2xl font-bold tracking-tight">A gentle Tuesday</h2></div>
                <span className="rounded-2xl bg-[#f8e4a1] p-3 text-[#97671e]"><Sparkles className="h-5 w-5" /></span>
              </div>
              <div className="grid gap-3 sm:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-2xl bg-[#f5edcf] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#80744f]">Today&apos;s little list</p>
                  <div className="mt-4 space-y-3">
                    {["Walk in the sunshine", "Finish project notes", "Call Maya"].map((item, index) => (
                      <div key={item} className="flex items-center gap-2.5 text-sm font-medium"><span className={`grid h-5 w-5 place-items-center rounded-full border ${index === 0 ? "border-[#84a75e] bg-[#84a75e] text-white" : "border-[#8c8a70]/35"}`}>{index === 0 && <Check className="h-3 w-3" />}</span><span className={index === 0 ? "text-[#85836b] line-through" : ""}>{item}</span></div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl bg-white/60 p-3 text-xs leading-5 text-[#716d54]"><Heart className="mr-1 inline h-3.5 w-3.5 fill-[#ef9a79] text-[#ef9a79]" /> Today&apos;s intention: leave room to breathe.</div>
                </div>
                <div className="rounded-2xl bg-[#eef3df] p-4">
                  <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[#68754f]">Shared day</p><UsersRound className="h-4 w-4 text-[#7d9a5e]" /></div>
                  <div className="mt-4 space-y-2.5">
                    <div className="flex gap-3 rounded-xl bg-white/70 p-3"><span className="mt-1 h-10 w-1 rounded-full bg-[#edb74e]" /><div><p className="text-sm font-semibold">Deep work</p><p className="mt-1 flex items-center gap-1 text-[11px] text-[#7a7c64]"><Clock3 className="h-3 w-3" />9:30 – 11:00</p></div></div>
                    <div className="flex gap-3 rounded-xl bg-white/70 p-3"><span className="mt-1 h-10 w-1 rounded-full bg-[#96ba71]" /><div><p className="text-sm font-semibold">Lunch with Maya</p><p className="mt-1 flex items-center gap-1 text-[11px] text-[#7a7c64]"><UsersRound className="h-3 w-3" />12:30 – 1:30</p></div></div>
                    <div className="flex gap-3 rounded-xl bg-white/70 p-3"><span className="mt-1 h-10 w-1 rounded-full bg-[#d9a6b8]" /><div><p className="text-sm font-semibold">Alex is busy</p><p className="mt-1 flex items-center gap-1 text-[11px] text-[#7a7c64]"><ShieldCheck className="h-3 w-3" />Details hidden</p></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-helps" className="border-y border-[#6d7551]/10 bg-[#eff4df] px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center"><span className="text-sm font-bold uppercase tracking-[0.18em] text-[#7b985a]">A happy little home for your time</span><h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Everything you need to make a good day.</h2></div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: CalendarDays, title: "Plan with intention", copy: "Turn tasks into a realistic daily schedule and keep your priorities close.", color: "bg-[#fae6a5] text-[#9a6b1f]" },
                { icon: UsersRound, title: "Find time together", copy: "See shared availability and focus blocks without awkward calendar screenshots.", color: "bg-[#d8e9bd] text-[#607b42]" },
                { icon: ShieldCheck, title: "Share only enough", copy: "Choose full details, busy times only, or hidden for every friendship.", color: "bg-[#f1d9df] text-[#946172]" },
              ].map(({ icon: Icon, title, copy, color }) => (
                <article key={title} className="rounded-[1.75rem] border border-[#68714c]/10 bg-[#fffdf5] p-6 shadow-[0_8px_30px_rgba(95,103,64,0.08)]">
                  <span className={`inline-grid h-12 w-12 place-items-center rounded-2xl ${color}`}><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#70755b]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 rounded-[2rem] bg-[#5f7048] p-8 text-[#fffbea] shadow-[0_12px_0_#465535] sm:p-12 md:flex-row">
            <div className="max-w-xl"><div className="flex items-center gap-2 text-sm font-semibold text-[#dce9c5]"><Leaf className="h-4 w-4" />Your days, growing gently</div><h2 className="mt-3 text-3xl font-bold tracking-tight">Ready for a calmer calendar?</h2><p className="mt-3 text-sm leading-6 text-white/70">Sunnie Planner is yours to host, shape, and share with the people you trust.</p></div>
            <button onClick={enterApp} className="group flex shrink-0 items-center gap-2 rounded-2xl bg-[#f4c85b] px-6 py-4 font-bold text-[#4b3b18] shadow-[0_5px_0_#cc9c32] transition hover:-translate-y-1">Open Sunnie <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button>
          </div>
        </section>
      </main>

      <footer className="relative z-[1] border-t border-[#6d7551]/10 bg-[#f7f0d6] px-5 py-8 text-sm text-[#6e7258] lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-[#4f563d]"><SunMedium className="h-5 w-5 text-[#d99d32]" />Sunnie Planner</div>
          <div>Built on open source · <Link href={getVersionGithubUrl()} target="_blank" className="font-semibold hover:text-[#65734a]">v{getAppVersion()}</Link></div>
        </div>
      </footer>
    </div>
  );
}
