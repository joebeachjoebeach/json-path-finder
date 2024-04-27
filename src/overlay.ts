// to get around the headache of semver comparisons, mapping version numbers
// to the order in which they're released
const VERSION_MAP = {
  "1.0.0": 1,
  "2.0.0": 2,
  "2.0.1": 3,
};
const VERSION = "2.0.1";
const LOCAL_STORAGE_VERSION_KEY = "lastVersionViewed";

function initOverlay(maskEl: HTMLDivElement) {
  function closeOverlayFromButton() {
    removeCloseOverlayListeners();
    document.body.removeChild(maskEl);
  }

  function closeOverlayFromMask(event: Event) {
    if (event.target !== event.currentTarget) return;
    removeCloseOverlayListeners();
    document.body.removeChild(maskEl);
  }

  function closeOverlayFromEsc(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    removeCloseOverlayListeners();
    document.body.removeChild(maskEl);
  }

  const closeButtons = document.querySelectorAll(".close-overlay-button");

  function removeCloseOverlayListeners() {
    closeButtons.forEach((closeButton) => {
      closeButton.removeEventListener("click", closeOverlayFromButton);
    });

    maskEl.removeEventListener("click", closeOverlayFromMask);

    document.body.removeEventListener("keyup", closeOverlayFromEsc);
  }

  closeButtons.forEach((closeButton) => {
    closeButton.addEventListener("click", closeOverlayFromButton);
  });

  maskEl.addEventListener("click", closeOverlayFromMask);

  document.body.addEventListener("keyup", closeOverlayFromEsc);
}

export function initVersion2Overlay() {
  const currentVersion = VERSION_MAP[VERSION];

  const lastVersionViewedStr = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
  const lastVersionViewed = parseInt(lastVersionViewedStr ?? "2", 10);

  if (lastVersionViewed < 2) {
    const overlayMask =
      document.querySelector<HTMLDivElement>("#v2-overlay-mask");
    if (!overlayMask) return;

    initOverlay(overlayMask);
    overlayMask.style.display = "block";
  }

  localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, currentVersion.toString());
}
