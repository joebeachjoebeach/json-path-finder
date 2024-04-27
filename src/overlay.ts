import { storeLastVersionViewed } from "./version";

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
  const lastVersionViewed = parseInt(storeLastVersionViewed() ?? "2", 10);

  if (lastVersionViewed < 2) {
    const overlayMask =
      document.querySelector<HTMLDivElement>("#v2-overlay-mask");
    if (!overlayMask) return;

    initOverlay(overlayMask);
    overlayMask.style.display = "block";
  }
}
