import { AppState } from "./state";

const SAVED_JSON_TEXT_KEY = "savedJsonText";

export function setUpLocalStorage(state: AppState) {
  const savedJsonText = localStorage.getItem(SAVED_JSON_TEXT_KEY);
  if (savedJsonText) {
    state.set("jsonText", savedJsonText);
  }

  state.subscribe("jsonText", "save to localStorage", (newText) => {
    localStorage.setItem(SAVED_JSON_TEXT_KEY, newText);
  });
}
