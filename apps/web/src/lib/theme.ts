export type ThemeChoice = "system" | "light" | "dark";

export function getTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem("ol-theme");
    if (v === "light" || v === "dark") return v;
  } catch {
    /* storage can be blocked */
  }
  return "system";
}

export function applyTheme(t: ThemeChoice) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
  try {
    if (t === "system") localStorage.removeItem("ol-theme");
    else localStorage.setItem("ol-theme", t);
  } catch {
    /* ignore */
  }
}
