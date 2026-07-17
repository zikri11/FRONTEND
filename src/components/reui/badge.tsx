import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center w-fit border border-transparent font-medium whitespace-nowrap outline-none transition-shadow",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-border bg-transparent dark:bg-input/32",
        secondary: "bg-secondary text-secondary-foreground",
        info: "bg-info text-white",
        success: "bg-success text-white",
        warning: "bg-warning text-white",
        destructive: "bg-destructive text-white",
        focus: "bg-focus text-focus-foreground",
        invert: "bg-invert text-invert-foreground",
        "primary-light":
          "ring-1 ring-inset ring-primary/20 bg-primary/10 text-primary dark:ring-primary/25 dark:bg-primary/15",
        "warning-light":
          "ring-1 ring-inset ring-warning/20 bg-warning/10 text-warning dark:ring-warning/25 dark:bg-warning/15",
        "success-light":
          "ring-1 ring-inset ring-success/20 bg-success/10 text-success dark:ring-success/25 dark:bg-success/15",
        "info-light":
          "ring-1 ring-inset ring-info/20 bg-info/10 text-info dark:ring-info/25 dark:bg-info/15",
        "destructive-light":
          "ring-1 ring-inset ring-destructive/20 bg-destructive/10 text-destructive dark:ring-destructive/25 dark:bg-destructive/15",
        "invert-light":
          "ring-1 ring-inset ring-invert/20 bg-invert/10 text-invert dark:ring-invert/45 dark:bg-invert/35",
        "focus-light":
          "ring-1 ring-inset ring-focus/20 bg-focus/10 text-focus dark:ring-focus/25 dark:bg-focus/15",
        "primary-outline":
          "bg-background border-border text-primary dark:bg-input/30",
        "warning-outline":
          "bg-background border-border text-warning dark:bg-input/30",
        "success-outline":
          "bg-background border-border text-success dark:bg-input/30",
        "info-outline":
          "bg-background border-border text-info dark:bg-input/30",
        "destructive-outline":
          "bg-background border-border text-destructive dark:bg-input/30",
        "invert-outline":
          "bg-background border-border text-invert-foreground dark:bg-input/30",
        "focus-outline":
          "bg-background border-border text-focus-foreground dark:bg-input/30",
      },
      size: {
        xs: "px-1 py-0.25 text-[0.6rem] leading-none h-4 min-w-4 gap-1",
        sm: "px-1 py-0.25 text-[0.625rem] leading-none h-4.5 min-w-4.5 gap-1",
        default: "px-1.25 py-0.5 text-xs h-5 min-w-5 gap-1",
        lg: "px-1.5 py-0.5 text-xs h-5.5 min-w-5.5 gap-1",
        xl: "px-2 py-0.75 text-sm h-6 min-w-6 gap-1.5",
      },
      /** `default`: active style radius. `full`: pill radius. */
      radius: {
        default:
          "rounded-sm",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "default",
    },
  }
)

interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof badgeVariants>["variant"]
  size?: VariantProps<typeof badgeVariants>["size"]
  radius?: VariantProps<typeof badgeVariants>["radius"]
}

function Badge({
  className,
  variant,
  size,
  radius,
  render,
  ...props
}: BadgeProps) {
  const defaultProps = {
    "data-slot": "badge",
    className: cn(badgeVariants({ variant, size, radius, className })),
  }

  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(defaultProps, props),
  })
}

export { Badge, badgeVariants, type BadgeProps }