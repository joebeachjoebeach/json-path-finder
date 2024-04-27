import { debounce, getErrorMessage } from "./helpers";
import { AppState } from "./state";

export function initEditor(state: AppState) {
  const editor = ace.edit("editor");
  editor.setTheme("ace/theme/chrome");
  editor.getSession().setMode("ace/mode/json");
  editor.getSession().setTabSize(2);
  editor.$blockScrolling = Infinity;
  editor.setShowPrintMargin(false);

  const debouncedSetJsonText = debounce((newJsonText: string) => {
    state.set("jsonText", newJsonText);
    try {
      JSON.parse(newJsonText);
    } catch (e) {
      state.set("error", getErrorMessage(e));
    }
  }, 500);

  editor.getSession().on("change", () => {
    debouncedSetJsonText(editor.getValue());
  });
  state.subscribe("jsonText", "set editor value", (newText) => {
    const cursorPosition = editor.getCursorPosition();
    editor.setValue(newText, 1);
    editor.moveCursorToPosition(cursorPosition);
  });

  editor.setValue(state.get("jsonText"));
  editor.moveCursorToPosition({ row: 0, column: 0 });
}

export function initSampleButton(state: AppState) {
  const loadSampleButton = document.getElementById("load-sample");
  if (!loadSampleButton) return;

  const handleFailure = (resetText: string) => {
    loadSampleButton.textContent = "Failed";
    setTimeout(() => {
      loadSampleButton.textContent = resetText;
    }, 3000);
  };

  loadSampleButton.addEventListener("click", async () => {
    const originalTextContent = loadSampleButton.textContent ?? "Sample";
    loadSampleButton.textContent = "Loading...";

    try {
      const res = await fetch("/assets/sample.json");
      if (!res.ok) {
        handleFailure(originalTextContent);
        return;
      }
      const jsonText = await res.text();
      state.set("jsonText", jsonText);

      loadSampleButton.textContent = originalTextContent;
    } catch (e) {
      handleFailure(originalTextContent);
    }
  });
}

export function initBeautifyButton(state: AppState) {
  document.getElementById("beautify")?.addEventListener("click", () => {
    state.set("jsonText", JSON.stringify(state.get("jsonData"), null, 2));
  });
}

export function initMinifyButton(state: AppState) {
  document.getElementById("minify")?.addEventListener("click", () => {
    state.set("jsonText", JSON.stringify(state.get("jsonData")));
  });
}
