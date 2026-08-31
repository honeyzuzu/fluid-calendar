import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/SignInForm";
import { SunnieSun } from "@/components/brand/SunnieSun";

import { getAuthOptions } from "@/lib/auth/auth-options";

export const metadata = {
  title: "Sign In | Sunnie Planner",
  description: "Sign in to your Sunnie Planner account",
};

export default async function SignInPage() {
  // Check if user is already signed in
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/calendar");
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#f8c95d]/15 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-[#b8d98b]/20 blur-3xl" />
      <div className="relative w-full max-w-md space-y-7">
        <div className="text-center">
          <SunnieSun className="mx-auto mb-5 h-20 w-20" face />
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#3f432e]">Welcome back, sunshine.</h1>
          <p className="mt-2 text-sm text-[#73775d]">
            Your plans are right where you left them.
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}
