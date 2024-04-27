function sizeBigBoxesToFitScreen() {
  document.querySelectorAll<HTMLElement>(".big-box").forEach((el) => {
    el.style.height = window.innerHeight - 90 + "px";
  });
}

export function initBigBoxes() {
  sizeBigBoxesToFitScreen();

  addEventListener("resize", () => {
    sizeBigBoxesToFitScreen();
  });
}
