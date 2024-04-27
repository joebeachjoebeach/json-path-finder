import { type AppState } from "./state";

export function initPathDisplay(state: AppState) {
  state.subscribe("path", "render path text in path element", (newPath) => {
    const pathBarInput = document.querySelector<HTMLInputElement>(
      "#reader-path-bar-input",
    );
    if (!pathBarInput) return;

    pathBarInput.value = newPath;
    state.set("copyButtonDisabled", false);
  });
}

export function initCopyButton(state: AppState) {
  const copyButton = document.getElementById("reader-path-bar-copy");
  if (!copyButton) return;

  state.subscribe("copyButtonDisabled", "disable copy button", (isDisabled) => {
    if (isDisabled) {
      copyButton.setAttribute("disabled", "");
      return;
    }
    copyButton.removeAttribute("disabled");
  });

  // initial state is that there's nothing in the path bar
  state.set("copyButtonDisabled", true);

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(state.get("path"));
    state.set("copyButtonDisabled", true);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      state.set("copyButtonDisabled", false);
      copyButton.textContent = "Copy";
    }, 1000);
  });
}
