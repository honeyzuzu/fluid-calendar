import { SunnieSkeleton } from "@/components/ui/sunnie";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <SunnieSkeleton className={cn("rounded-md", className)} {...props} />;
}

export { Skeleton };
