import { type AppState } from "./state";

const LIGHT_CSS = `html {
    -webkit-filter: invert(0%) brightness(1) saturate(1) hue-rotate(0deg);
    -moz-filter: invert(0%) brightness(1) saturate(1) hue-rotate(0deg);
    -o-filter: invert(0%) brightness(1) saturate(1) hue-rotate(0deg);
    -ms-filter: invert(0%) brightness(1) saturate(1) hue-rotate(0deg);
  }`;

const DARK_CSS = `html {
    -webkit-filter: invert(85%) brightness(.9) saturate(1.5) hue-rotate(180deg);
    -moz-filter: invert(85%) brightness(.9) saturate(1.5) hue-rotate(180deg);
    -o-filter: invert(85%) brightness(.9) saturate(1.5) hue-rotate(180deg);
    -ms-filter: invert(85%) brightness(.9) saturate(1.5) hue-rotate(180deg);
  }`;

function setCss(css: string) {
  const head = document.querySelector("head");
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  head?.appendChild(style);
}

export function initDarkMode(state: AppState) {
  state.subscribe(
    "isDarkMode",
    "set dark mode and button text",
    (isDarkMode) => {
      const darkModeButton = document.getElementById("dark-mode-button");
      if (!darkModeButton) return;

      if (isDarkMode) {
        setCss(DARK_CSS);
        darkModeButton.title = "Light Mode";
        return;
      }
      setCss(LIGHT_CSS);
      darkModeButton.title = "Dark Mode";
    },
  );

  const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
  const isDarkMode = prefersDarkMode.matches;

  state.set("isDarkMode", isDarkMode);

  document.getElementById("dark-mode-button")?.addEventListener("click", () => {
    const hasBeenDarkMode = state.get("isDarkMode");
    state.set("isDarkMode", !hasBeenDarkMode);
  });

  prefersDarkMode.addEventListener("change", (event) => {
    state.set("isDarkMode", event.matches);
  });
}
