/**
 * applyThemeWithTransition — wrap a next-themes setTheme call so the entire UI
 * crossfades between palettes over ~320ms instead of flipping instantly.
 *
 * Adds `theme-transitioning` to <html> for the duration of the swap; a universal
 * CSS rule in globals.css picks that up and applies a `transition` to bg / border /
 * color / fill / stroke on every element. The class is removed once the
 * transition window has elapsed so subsequent hover transitions are not slowed.
 */
export function applyThemeWithTransition(
  setTheme: (t: string) => void,
  value: string,
): void {
  if (typeof document === "undefined") {
    setTheme(value);
    return;
  }
  document.documentElement.classList.add("theme-transitioning");
  setTheme(value);
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transitioning");
  }, 350);
}
