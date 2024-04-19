// to get around the headache of semver comparisons, mapping version numbers
// to the order in which they're released
const VERSION_MAP = {
  "1.0.0": 1,
  "2.0.0": 2,
};
const VERSION = "2.0.0";

const COPY = "Copy";
const COPIED = "Copied";
const LOCAL_STORAGE_VERSION_KEY = "lastVersionViewed";

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

const initialJsonData = {
  instructions: [
    "Enter your JSON in the editor.",
    "Select an item to view its path.",
    "Replace 'x' with the name of your variable.",
  ],
};

class State {
  #debug = false;
  #fields = new Map();
  #subscribers = new Map();
  #initialState = {
    isDarkMode: false,
    jsonData: initialJsonData,
    jsonText: JSON.stringify(initialJsonData, null, 2),
    path: "",
    copyButtonDisabled: false,
    copyButtonText: COPY,
    error: "",
    selectedNode: null,
  };

  constructor() {
    Object.entries(this.#initialState).forEach(([key, val]) => {
      this.#fields.set(key, val);
      this.#subscribers.set(key, []);

      const capitalizedKey = this.#capitalizeFirstLetter(key);
      const getMethodName = `get${capitalizedKey}`;
      const setMethodName = `set${capitalizedKey}`;
      const subscribeMethodName = `subscribe${capitalizedKey}`;

      this[getMethodName] = () => this.#get(key);

      this[setMethodName] = (newVal) => {
        this.#set(key, newVal);
      };
      this[subscribeMethodName] = (label, callback) => {
        this.#subscribe(key, label, callback);
      };
      if (typeof val === "boolean") {
        const toggleMethodName = `toggle${capitalizedKey}`;
        this[toggleMethodName] = () => {
          this.#toggle(key);
        };
      }
    });
  }

  #capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  #validateProp(prop) {
    if (!this.#fields.has(prop)) {
      throw new Error(`unregistered prop ${prop}`);
    }
  }

  #get(prop) {
    this.#validateProp(prop);
    const value = this.#fields.get(prop);
    if (this.#debug) {
      console.log("get", { prop, value });
    }
    return value;
  }

  #set(prop, newValue) {
    this.#validateProp(prop);
    const lastValue = this.#get(prop);

    if (this.#debug) {
      console.log("set", { prop, newValue, lastValue });
    }

    if (lastValue === newValue) {
      return;
    }

    this.#fields.set(prop, newValue);
    this.#subscribers.get(prop).forEach(({ label, callback }) => {
      if (this.#debug) {
        console.log("subscriber triggered", {
          prop,
          label,
          newValue,
          lastValue,
        });
      }
      callback(newValue, lastValue);
    });
  }

  #toggle(prop) {
    if (this.#debug) {
      console.log("toggle", { prop });
    }
    this.#validateProp(prop);
    const lastValue = this.#get(prop);
    if (typeof lastValue !== "boolean") {
      throw new Error(`cannot toggle non-boolean prop ${prop}`);
    }
    this.#set(prop, !lastValue);
  }

  #subscribe(prop, label, callback) {
    if (this.#debug) {
      console.log("subscribe", { prop, label, callback: callback.toString() });
    }
    this.#validateProp(prop);
    this.#subscribers.get(prop).push({ label, callback });
  }
}

function setCss(css) {
  const head = document.querySelector("head");
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}

function initDarkMode(state) {
  state.subscribeIsDarkMode("set dark mode and button text", (isDarkMode) => {
    const darkModeButton = document.getElementById("dark-mode-button");
    if (isDarkMode) {
      setCss(DARK_CSS);
      darkModeButton.title = "Light Mode";
      return;
    }
    setCss(LIGHT_CSS);
    darkModeButton.title = "Dark Mode";
  });

  const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
  const isDarkMode = prefersDarkMode.matches;

  state.setIsDarkMode(isDarkMode);

  document.getElementById("dark-mode-button").addEventListener("click", () => {
    state.toggleIsDarkMode();
  });

  prefersDarkMode.addEventListener("change", (event) => {
    state.setIsDarkMode(event.matches);
  });
}

function debounce(callback, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}

function initEditor(state) {
  const editor = ace.edit("editor");
  editor.setTheme("ace/theme/chrome");
  editor.getSession().setMode("ace/mode/json");
  editor.getSession().setTabSize(2);
  editor.$blockScrolling = Infinity;
  editor.setShowPrintMargin(false);

  const debouncedSetJsonText = debounce((newJsonText) => {
    state.setJsonText(newJsonText);
    try {
      JSON.parse(newJsonText);
    } catch (e) {
      state.setError(e.message);
    }
  }, 500);

  editor.getSession().on("change", (e) => {
    debouncedSetJsonText(editor.getValue());
  });
  state.subscribeJsonText("set editor value", (newJson) => {
    const cursorPosition = editor.getCursorPosition();
    editor.setValue(newJson, 1);
    editor.moveCursorToPosition(cursorPosition);
  });

  editor.setValue(state.getJsonText());
  editor.moveCursorToPosition({ row: 0, column: 0 });
}

function toEntries(arrOrObj) {
  if (Array.isArray(arrOrObj)) {
    return arrOrObj.map((item, index) => [index, item]);
  }
  return Object.entries(arrOrObj);
}

function isLeafNode(value) {
  return (value === null) | (value === undefined) | (typeof value !== "object");
}

function appendKeyToPath(key, path) {
  if (Number.isInteger(key)) {
    return `${path}[${key.toString()}]`;
  }

  if (/[^A-Za-z0-9_$]/.test(key)) {
    return `${path}["${key}"]`;
  }

  return `${path}.${key}`;
}

function renderLeafNode({ key, value, path }, state) {
  const newPath = appendKeyToPath(key, path);

  const button = document.createElement("button");
  button.classList.add("json-reader-tree-property");
  button.addEventListener("click", () => {
    state.setSelectedNode(button);
    state.setPath(newPath);
  });

  const keySpan = document.createElement("span");
  keySpan.textContent = `${key}:`;
  button.appendChild(keySpan);

  const valSpan = document.createElement("span");
  valSpan.classList.add("json-reader-tree-property-value");
  valSpan.textContent = value?.toString() || "null";
  button.appendChild(valSpan);

  return button;
}

function renderParentNode({ key, value, path }, state) {
  const newPath = appendKeyToPath(key, path);

  const details = document.createElement("details");

  const summary = document.createElement("summary");
  summary.classList.add("json-reader-tree-parent");
  summary.addEventListener("click", () => {
    state.setSelectedNode(summary);
    state.setPath(newPath);
  });
  details.appendChild(summary);

  const keySpan = document.createElement("span");
  keySpan.textContent = `${key}:`;
  summary.appendChild(keySpan);

  const subtree = renderTree(value, state, { path: newPath, isSubtree: true });
  details.appendChild(subtree);

  return details;
}

function renderTree(obj, state, { path = "x", isSubtree = false } = {}) {
  const entries = toEntries(obj);

  const rootDiv = document.createElement("div");
  if (isSubtree) {
    rootDiv.classList.add("json-reader-tree-subtree");
  }

  entries.forEach(([key, value]) => {
    const property = isLeafNode(value)
      ? renderLeafNode({ key, value, path }, state)
      : renderParentNode({ key, value, path }, state);

    rootDiv.appendChild(property);
  });

  return rootDiv;
}

function renderReader(obj, state) {
  const rootDiv = document.createElement("div");
  rootDiv.classList.add("json-reader-tree");

  const tree = renderTree(obj, state);
  rootDiv.appendChild(tree);

  const reader = document.getElementById("json-reader");
  reader.textContent = "";

  reader.appendChild(rootDiv);
}

function initReader(state) {
  state.subscribeJsonText("set json data when json text changes", (newText) => {
    try {
      const newData = JSON.parse(newText);
      state.setJsonData(newData);
      state.setError("");
    } catch (e) {
      state.setError(e.message);
    }
  });

  state.subscribeJsonData("render reader", (newData) => {
    renderReader(newData, state);
  });
}

function initErrorDisplay(state) {
  state.subscribeError("render error message", (error) => {
    if (!!error) {
      const errorDiv = document.createElement("div");
      errorDiv.id = "json-reader-error";

      const errorPreamble = document.createElement("div");
      errorPreamble.classList.add("json-reader-error-part");
      errorPreamble.textContent =
        "There seems to be a problem with your JSON. Error message:";

      const errorContents = document.createElement("div");
      errorContents.classList.add("json-reader-error-part");

      const errorMessage = document.createElement("span");
      errorMessage.id = "json-reader-error-message";
      errorMessage.textContent = error;

      errorContents.appendChild(errorMessage);
      errorDiv.appendChild(errorPreamble);
      errorDiv.appendChild(errorContents);

      const reader = document.getElementById("json-reader");
      reader.innerHTML = "";
      reader.appendChild(errorDiv);
    }
  });
}

function initDefaultReader(state) {
  document.querySelectorAll("[data-path]").forEach((el) => {
    el.addEventListener("click", () => {
      state.setSelectedNode(el);
      state.setPath(el.dataset.path);
    });
  });
}

function initPathDisplay(state) {
  state.subscribePath("render path text in path element", (newPath) => {
    document.querySelector("#reader-path-bar-input").value = newPath;
    state.setCopyButtonDisabled(false);
  });
}

function initSelectedNode(state) {
  state.subscribeSelectedNode(
    "make selected node have selected class",
    (newNode, lastNode) => {
      if (lastNode) {
        lastNode.classList.remove("json-reader-tree-property-selected");
      }
      if (newNode) {
        newNode.classList.add("json-reader-tree-property-selected");
      }
    }
  );
}

function initSampleButton(state) {
  const loadSampleButton = document.getElementById("load-sample");

  const handleFailure = (resetText) => {
    loadSampleButton.textContent = "Failed";
    setTimeout(() => {
      loadSampleButton.textContent = resetText;
    }, 3000);
  };

  loadSampleButton.addEventListener("click", async () => {
    const originalTextContent = loadSampleButton.textContent;
    loadSampleButton.textContent = "Loading...";

    try {
      const res = await fetch("/assets/sample.json");
      if (!res.ok) {
        handleFailure(originalTextContent);
        return;
      }
      const jsonText = await res.text();
      state.setJsonText(jsonText);

      loadSampleButton.textContent = originalTextContent;
    } catch (e) {
      handleFailure(originalTextContent);
    }
  });
}

function initBeautifyButton(state) {
  document.getElementById("beautify").addEventListener("click", () => {
    state.setJsonText(JSON.stringify(state.getJsonData(), null, 2));
  });
}

function initMinifyButton(state) {
  document.getElementById("minify").addEventListener("click", () => {
    state.setJsonText(JSON.stringify(state.getJsonData()));
  });
}

function initCopyButton(state) {
  const copyButton = document.getElementById("reader-path-bar-copy");

  state.subscribeCopyButtonDisabled("disable copy button", (isDisabled) => {
    if (isDisabled) {
      copyButton.setAttribute("disabled", "");
      return;
    }
    copyButton.removeAttribute("disabled");
  });

  state.subscribeCopyButtonText("update copy button text", (text) => {
    copyButton.textContent = text;
  });

  // initial state is that there's nothing in the path bar
  state.setCopyButtonDisabled(true);

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(state.getPath());
    state.setCopyButtonDisabled(true);
    state.setCopyButtonText(COPIED);
    setTimeout(() => {
      state.setCopyButtonDisabled(false);
      state.setCopyButtonText(COPY);
    }, 1000);
  });
}

function sizeBigBoxesToFitScreen() {
  document.querySelectorAll(".big-box").forEach((el) => {
    el.style.height = window.innerHeight - 90 + "px";
  });
}

function initBigBoxes() {
  sizeBigBoxesToFitScreen();

  addEventListener("resize", () => {
    sizeBigBoxesToFitScreen();
  });
}

function initOverlay(maskEl) {
  function closeOverlayFromButton() {
    removeCloseOverlayListeners();
    document.body.removeChild(maskEl);
  }

  function closeOverlayFromMask(event) {
    if (event.target !== event.currentTarget) return;
    removeCloseOverlayListeners();
    document.body.removeChild(maskEl);
  }

  function closeOverlayFromEsc(event) {
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

function initVersion2Overlay() {
  const currentVersion = VERSION_MAP[VERSION];

  const lastVersionViewedStr = localStorage.getItem("lastVersionViewed");
  const lastVersionViewed = parseInt(lastVersionViewedStr ?? 2, 10);

  if (lastVersionViewed < currentVersion) {
    const overlayMask = document.getElementById("v2-overlay-mask");
    initOverlay(overlayMask);
    overlayMask.style.display = "block";
  }

  localStorage.setItem("lastVersionViewed", currentVersion);
}

document.addEventListener("DOMContentLoaded", () => {
  const state = new State();

  initDarkMode(state);
  initEditor(state);
  initReader(state);
  initDefaultReader(state);
  initPathDisplay(state);
  initSelectedNode(state);
  initSampleButton(state);
  initBeautifyButton(state);
  initMinifyButton(state);
  initCopyButton(state);
  initErrorDisplay(state);
  initBigBoxes();
  initVersion2Overlay();
});
