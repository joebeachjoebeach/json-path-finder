import "./style.css";
import { appState } from "./state";
import { initDefaultReader, Reader } from "./reader";
import { initDarkMode } from "./dark-mode";
import {
  initEditor,
  initSampleButton,
  initBeautifyButton,
  initMinifyButton,
} from "./editor";
import { initPathDisplay, initCopyButton } from "./path-bar";
import { initVersion2Overlay } from "./overlay";
import { initBigBoxes } from "./big-boxes";

document.addEventListener("DOMContentLoaded", () => {
  const reader = new Reader(appState);
  reader.init();

  initDefaultReader(appState);
  initEditor(appState);
  initPathDisplay(appState);
  initCopyButton(appState);
  initDarkMode(appState);
  initSampleButton(appState);
  initBeautifyButton(appState);
  initMinifyButton(appState);
  initBigBoxes();
  initVersion2Overlay();
});
