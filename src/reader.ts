import { type JSONObjOrArr, type JSONPrimitive } from "./types";
import { type AppState } from "./state";
import { getErrorMessage } from "./helpers";

function toEntries<T>(
  arrOrObj: T[] | Record<string, T>,
): [string | number, T][] {
  if (Array.isArray(arrOrObj)) {
    return arrOrObj.map((item, index) => [index, item]);
  }
  return Object.entries(arrOrObj);
}

interface RenderParamBase {
  key: string | number;
  path: string;
}
type RenderLeafNodeParam = RenderParamBase & { value: JSONPrimitive };
type RenderParentParam = RenderParamBase & { value: JSONObjOrArr };

export class Reader {
  private state: AppState;

  constructor(state: AppState) {
    this.state = state;
  }

  private static isLeafNode(value: unknown): value is JSONPrimitive {
    return value === null || value === undefined || typeof value !== "object";
  }

  private static appendKeyToPath(key: string | number, path: string) {
    if (Number.isInteger(key)) {
      return `${path}[${key.toString()}]`;
    }

    if (/[^A-Za-z0-9_$]/.test(key.toString())) {
      return `${path}["${key}"]`;
    }

    return `${path}.${key}`;
  }

  private renderLeafNode({ key, value, path }: RenderLeafNodeParam) {
    const newPath = Reader.appendKeyToPath(key, path);

    const button = document.createElement("button");
    button.classList.add("json-reader-tree-property");
    button.addEventListener("click", () => {
      this.state.set("selectedNode", button);
      this.state.set("path", newPath);
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

  private renderParentNode({ key, value, path }: RenderParentParam) {
    const newPath = Reader.appendKeyToPath(key, path);

    const details = document.createElement("details");

    const summary = document.createElement("summary");
    summary.classList.add("json-reader-tree-parent");
    summary.addEventListener("click", () => {
      this.state.set("selectedNode", summary);
      this.state.set("path", newPath);
    });
    details.appendChild(summary);

    const keySpan = document.createElement("span");
    keySpan.textContent = `${key}:`;
    summary.appendChild(keySpan);

    const subtree = this.renderTree(value, {
      path: newPath,
      isSubtree: true,
    });
    details.appendChild(subtree);

    return details;
  }

  private renderTree(
    obj: JSONObjOrArr,
    { path = "x", isSubtree = false } = {},
  ) {
    const entries = toEntries(obj);

    const rootDiv = document.createElement("div");
    if (isSubtree) {
      rootDiv.classList.add("json-reader-tree-subtree");
    }

    entries.forEach(([key, value]) => {
      const property = Reader.isLeafNode(value)
        ? this.renderLeafNode({ key, value, path })
        : this.renderParentNode({ key, value, path });

      rootDiv.appendChild(property);
    });

    return rootDiv;
  }

  private renderReader(obj: JSONObjOrArr): void {
    const rootDiv = document.createElement("div");
    rootDiv.classList.add("json-reader-tree");

    const tree = this.renderTree(obj);
    rootDiv.appendChild(tree);

    const reader = document.getElementById("json-reader");
    if (!reader) return;

    reader.textContent = "";

    reader.appendChild(rootDiv);
  }

  initReader() {
    this.state.subscribe(
      "jsonText",
      "set json data when json text changes",
      (newText, lastText) => {
        // if it's just that the text is being minified/beautified, do nothing
        const newStringified = JSON.stringify(JSON.parse(newText));
        const lastStringified = JSON.stringify(JSON.parse(lastText));
        if (newStringified === lastStringified) return;

        try {
          const newData = JSON.parse(newText);
          this.state.set("jsonData", newData);
          this.state.set("error", "");
        } catch (e) {
          this.state.set("error", getErrorMessage(e));
        }
      },
    );

    this.state.subscribe("jsonData", "render reader", (newData) => {
      this.renderReader(newData);
    });
  }

  initErrorDisplay() {
    this.state.subscribe("error", "render error message", (error) => {
      if (error) {
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
        if (!reader) return;

        reader.innerHTML = "";
        reader.appendChild(errorDiv);
      }
    });
  }

  init() {
    this.initReader();
    this.initErrorDisplay();
  }
}

export function initDefaultReader(state: AppState) {
  document.querySelectorAll<HTMLElement>("[data-path]").forEach((el) => {
    el.addEventListener("click", () => {
      state.set("selectedNode", el);
      state.set("path", el?.dataset?.path ?? "Sorry, could not find path");
    });
  });

  state.subscribe(
    "selectedNode",
    "make selected node have selected class",
    (newNode, lastNode) => {
      lastNode?.classList.remove("json-reader-tree-property-selected");
      newNode?.classList.add("json-reader-tree-property-selected");
    },
  );
}
