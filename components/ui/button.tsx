import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui's button. `buttonVariants` also dresses links — `<Link
 * className={buttonVariants()}>` — so a navigation is still an `<a>`, not a
 * button pretending (no Radix Slot on a static site). Focus is the site-wide
 * `:focus-visible` outline in globals.css, not a second ring.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        brand: "bg-brand text-brand-foreground shadow-xs hover:bg-brand/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline decoration-brand/50 underline-offset-4 hover:decoration-brand",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button data-slot="button" type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
