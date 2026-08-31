import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { SunnieSun } from "@/components/brand/SunnieSun";

export const metadata = {
  title: "Reset Password - Sunnie Planner",
  description: "Reset your Sunnie Planner account password",
};

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-[calc(100dvh-6rem)] w-full flex-col items-center justify-center overflow-hidden bg-[#fff9e8] px-4 py-12">
      <div aria-hidden="true" className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#f8c95d]/15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <SunnieSun className="mx-auto mb-6 h-16 w-16" face />
        <PasswordResetForm />
      </div>
    </div>
  );
}
