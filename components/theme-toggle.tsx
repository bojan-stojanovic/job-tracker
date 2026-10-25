"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // Starts as false on the server and on the first client render, so the
  // markup matches. The real value is read after mount.
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage can be blocked. The theme still changes for this visit.
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      className="rounded px-2 py-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>{" "}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}