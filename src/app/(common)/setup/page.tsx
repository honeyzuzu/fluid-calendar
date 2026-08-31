import { redirect } from "next/navigation";

import { SetupForm } from "@/components/setup/SetupForm";
import { SunnieSun } from "@/components/brand/SunnieSun";

import { checkSetupStatus } from "@/lib/setup-actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Setup Sunnie Planner",
  description: "Set up your Sunnie Planner admin account",
};

export default async function SetupPage() {
  // Check if any users already exist
  const { needsSetup } = await checkSetupStatus();

  // If users already exist, redirect to home page
  if (!needsSetup) {
    redirect("/calendar");
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center overflow-hidden bg-[#fff9e8] p-4">
      <div aria-hidden="true" className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#f8c95d]/15 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-[#b8d98b]/20 blur-3xl" />
      <div className="relative mb-7 text-center">
        <SunnieSun className="mx-auto mb-5 h-20 w-20" face />
        <h1 className="mb-2 text-4xl font-bold tracking-[-0.05em] text-[#3f432e]">Let&apos;s make it Sunnie.</h1>
        <p className="text-[#73775d]">
          Create the first admin account for your cozy shared planner.
        </p>
      </div>

      <div className="relative w-full max-w-md"><SetupForm /></div>
    </div>
  );
}
