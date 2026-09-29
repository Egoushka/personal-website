/** How wide a page runs: most pages at 80rem, the docs at 90rem for their three columns. */
export type Width = "default" | "wide";

export const WIDTHS: Record<Width, string> = {
  default: "max-w-7xl",
  wide: "max-w-[90rem]",
};

/** The page gutter, one place: 16px on a phone, 24px on a tablet, 32px from a laptop up. */
export const GUTTER = "px-4 sm:px-6 lg:px-8";
