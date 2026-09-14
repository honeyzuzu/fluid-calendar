import { cn } from "@/lib/utils";

export function PageHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("grid min-w-0 gap-1", className)} {...props}>
      {children}
    </section>
  );
}

export function PageHeaderHeading({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-2xl font-bold leading-[1.15] tracking-[-0.035em] sm:text-[1.75rem]",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function PageHeaderDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "max-w-2xl text-sm leading-6 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
