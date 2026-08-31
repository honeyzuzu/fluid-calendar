import { SunMedium } from "lucide-react";

import { cn } from "@/lib/utils";

export function SunnieSun({ className, face = false }: { className?: string; face?: boolean }) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center rounded-full bg-[#f8c95d] text-[#77591d] shadow-[0_4px_0_#e6ae3e]", className)} aria-hidden="true">
      <SunMedium className="h-[68%] w-[68%]" strokeWidth={1.8} />
      {face && <><span className="absolute top-[39%] flex gap-[0.8rem]"><span className="h-1 w-1 rounded-full bg-[#77591d]" /><span className="h-1 w-1 rounded-full bg-[#77591d]" /></span><span className="absolute top-[56%] h-1.5 w-3 rounded-b-full border-b-2 border-[#77591d]" /></>}
    </span>
  );
}
