import { useSyncExternalStore } from "react";

const colorSchemeQuery = "(prefers-color-scheme: dark)";

function subscribeToColorScheme(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const query = window.matchMedia(colorSchemeQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getColorScheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(colorSchemeQuery).matches ? "dark" : "light";
}

export function useColorScheme() {
  return useSyncExternalStore(
    subscribeToColorScheme,
    getColorScheme,
    () => "light",
  );
}
