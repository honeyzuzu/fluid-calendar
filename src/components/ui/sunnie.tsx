import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const panelVariants = cva(
  "sunnie-surface relative min-w-0 border text-card-foreground",
  {
    variants: {
      treatment: {
        clean: "bg-card",
        paper: "bg-card",
        soft: "bg-muted",
        glass: "bg-card/80 backdrop-blur-md",
      },
      radius: {
        control: "rounded-xl",
        card: "rounded-[var(--radius-card)]",
        dialog: "rounded-[var(--radius-dialog)]",
        hero: "rounded-[var(--radius-hero)]",
      },
      elevation: {
        none: "shadow-none",
        paper: "shadow-[var(--shadow-paper)]",
        raised: "shadow-[var(--shadow-raised)]",
      },
      density: {
        compact: "p-3",
        comfortable: "p-4 sm:p-5",
        spacious: "p-5 sm:p-7",
        none: "p-0",
      },
    },
    defaultVariants: {
      treatment: "clean",
      radius: "card",
      elevation: "paper",
      density: "comfortable",
    },
  }
);

export interface SunniePanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {}

export const SunniePanel = React.forwardRef<HTMLDivElement, SunniePanelProps>(
  ({ className, treatment, radius, elevation, density, ...props }, ref) => (
    <div
      ref={ref}
      data-treatment={treatment ?? "clean"}
      className={cn(
        panelVariants({ treatment, radius, elevation, density }),
        className
      )}
      {...props}
    />
  )
);
SunniePanel.displayName = "SunniePanel";

export const SunnieCard = SunniePanel;

export const SunniePaper = React.forwardRef<
  HTMLDivElement,
  Omit<SunniePanelProps, "treatment">
>(({ className, ...props }, ref) => (
  <SunniePanel ref={ref} treatment="paper" className={className} {...props} />
));
SunniePaper.displayName = "SunniePaper";

export const ThemeSurface = React.forwardRef<HTMLDivElement, SunniePanelProps>(
  ({ className, ...props }, ref) => (
    <SunniePanel ref={ref} className={className} {...props} />
  )
);
ThemeSurface.displayName = "ThemeSurface";

type PageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export const SunniePageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    { className, eyebrow, title, description, actions, children, ...props },
    ref
  ) => (
    <header
      ref={ref}
      className={cn(
        "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold leading-[1.15] tracking-[-0.035em] text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  )
);
SunniePageHeader.displayName = "SunniePageHeader";

export const SunnieToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="toolbar"
    className={cn(
      "sunnie-surface flex min-w-0 flex-wrap items-center gap-2 rounded-[var(--radius-card)] border bg-card/90 p-2 shadow-[var(--shadow-paper)]",
      className
    )}
    {...props}
  />
));
SunnieToolbar.displayName = "SunnieToolbar";

const chipVariants = cva(
  "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      tone: {
        neutral: "border-border bg-card text-secondary-foreground",
        muted: "border-transparent bg-muted text-secondary-foreground",
        accent:
          "border-transparent bg-accent text-accent-foreground shadow-[var(--shadow-paper)]",
        primary: "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface SunnieChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  asChild?: boolean;
}

export const SunnieChip = React.forwardRef<HTMLSpanElement, SunnieChipProps>(
  ({ asChild = false, className, tone, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        ref={ref}
        className={cn(chipVariants({ tone }), className)}
        {...props}
      />
    );
  }
);
SunnieChip.displayName = "SunnieChip";

export const SunnieSegmentedControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    className={cn(
      "inline-flex min-w-0 items-center gap-1 rounded-2xl border border-border bg-card/90 p-1 shadow-[var(--shadow-paper)]",
      className
    )}
    {...props}
  />
));
SunnieSegmentedControl.displayName = "SunnieSegmentedControl";

export const SunnieSegmentedItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }
>(({ className, selected = false, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-pressed={selected}
    className={cn(
      "min-h-9 min-w-0 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-[background-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      selected
        ? "bg-accent text-accent-foreground shadow-[var(--shadow-paper)]"
        : "hover:bg-muted hover:text-foreground",
      className
    )}
    {...props}
  />
));
SunnieSegmentedItem.displayName = "SunnieSegmentedItem";

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export const SunnieEmptyState = React.forwardRef<
  HTMLDivElement,
  EmptyStateProps
>(({ className, icon, title, description, action, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-w-0 flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-card/45 px-5 py-10 text-center",
      className
    )}
    {...props}
  >
    {icon && (
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-muted text-primary [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    )}
    <h2 className="text-base font-bold text-foreground">{title}</h2>
    {description && (
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
));
SunnieEmptyState.displayName = "SunnieEmptyState";

export const SunnieSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn(
      "animate-pulse rounded-xl bg-[linear-gradient(100deg,hsl(var(--muted))_20%,hsl(var(--card))_50%,hsl(var(--muted))_80%)] bg-[length:220%_100%]",
      className
    )}
    {...props}
  />
));
SunnieSkeleton.displayName = "SunnieSkeleton";

export const DecorativeCorner = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden="true"
    className={cn(
      "sunnie-decorative-corner sunnie-decorative-motion pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
      className
    )}
    {...props}
  />
);

export const SunnieSheet = React.forwardRef<HTMLDivElement, SunniePanelProps>(
  ({ className, ...props }, ref) => (
    <SunniePanel
      ref={ref}
      radius="dialog"
      elevation="raised"
      className={cn(
        "fixed inset-x-3 bottom-3 z-50 max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:inset-x-auto sm:bottom-auto",
        className
      )}
      {...props}
    />
  )
);
SunnieSheet.displayName = "SunnieSheet";

export { panelVariants, chipVariants };
