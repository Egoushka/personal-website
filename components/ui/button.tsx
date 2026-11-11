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
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "key key-primary",
        brand: "key key-primary",
        secondary: "key",
        outline: "key",
        ghost: "key key-ghost",
        link: "inline-flex items-center text-foreground underline decoration-brand/50 underline-offset-4 hover:decoration-brand",
      },
      size: {
        default: "",
        sm: "key-sm",
        lg: "key-lg",
        icon: "key-icon",
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
