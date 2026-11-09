/** Height of the sticky site header, read from the --header-h CSS variable. */
export function headerHeight(): number {
  if (typeof window === "undefined") return 0;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h"));
  return Number.isFinite(v) ? v : 0;
}
