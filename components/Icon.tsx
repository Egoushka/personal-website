import { ICONS } from "@/lib/icons";

/**
 * A 24×24 single-path mark, inherited colour, decorative by default.
 *
 * Every icon is vendored in lib/icons.ts rather than fetched: the CSP here is
 * `script-src 'self'` and there is no icon font, no sprite request and no
 * runtime dependency. An unknown key renders nothing at all, so a skill that
 * has no mark simply sits flush with the others instead of showing a box.
 */
export default function Icon({ name, size = 15 }: { name?: string; size?: number }) {
  const d = name ? ICONS[name] : undefined;
  if (!d) return null;

  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
