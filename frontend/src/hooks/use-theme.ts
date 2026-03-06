import { useCallback } from "react";

export function useTheme() {
  const isDark = document.documentElement.classList.contains("dark");

  const toggle = useCallback(() => {
    const next = isDark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("mednoteai-theme", next);
    // Force re-render by dispatching a custom event
    window.dispatchEvent(new Event("theme-change"));
  }, [isDark]);

  return { isDark, toggle };
}
