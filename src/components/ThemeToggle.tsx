"use client";

function appliedTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="ghost theme-toggle"
      onClick={() => {
        const next = appliedTheme() === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem("grok-cats-theme", next);
      }}
    >
      <span className="when-dark">Light mode</span>
      <span className="when-light">Dark mode</span>
    </button>
  );
}
