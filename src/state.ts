import { type JSONObjOrArr } from "./types";

type SubscriberCallback<T> = (newValue: T, lastValue: T) => void;

interface Subscriber<T> {
  label: string;
  callback: SubscriberCallback<T>;
}

type Subscribers<T> = {
  [K in keyof T]?: Subscriber<T[K]>[];
};

class State<StateShape extends Record<string, unknown>> {
  // change `false` to `true` to enable debug logging in dev
  #debug = import.meta.env.MODE === "development" && false;
  private internalState: StateShape;
  private subscribers: Subscribers<StateShape>;

  constructor(initialState: StateShape) {
    this.internalState = { ...initialState };
    this.subscribers = {};

    (Object.keys(initialState) as Array<keyof StateShape>).forEach((key) => {
      this.subscribers[key] = [];
    });
  }

  private static logDebug(...args: Parameters<typeof console.log>) {
    console.log(...args);
    console.trace();
  }

  get<PropType extends keyof StateShape>(prop: PropType): StateShape[PropType] {
    const value = this.internalState[prop];
    if (this.#debug) {
      State.logDebug("State.get", { prop, value });
    }
    return value;
  }

  set<PropType extends keyof StateShape>(
    prop: PropType,
    newValue: StateShape[PropType],
  ): void {
    const lastValue = this.get(prop);

    if (this.#debug) {
      State.logDebug("State.set", { prop, newValue, lastValue });
    }

    if (lastValue === newValue) {
      return;
    }

    this.internalState[prop] = newValue;

    this.subscribers[prop]?.forEach(({ label, callback }) => {
      if (this.#debug) {
        State.logDebug("State: subscriber triggered", {
          prop,
          label,
          newValue,
          lastValue,
        });
      }
      callback(newValue, lastValue);
    });
  }

  subscribe<PropType extends keyof StateShape>(
    prop: PropType,
    label: string,
    callback: SubscriberCallback<StateShape[PropType]>,
  ): void {
    if (this.#debug) {
      State.logDebug("State.subscribe", {
        prop,
        label,
        callback: callback.toString(),
      });
    }
    this.subscribers[prop]?.push({ label, callback });
  }
}

type InitialState = {
  isDarkMode: boolean;
  jsonData: JSONObjOrArr;
  jsonText: string;
  path: string;
  copyButtonDisabled: boolean;
  error: string;
  selectedNode: HTMLElement | null;
};

const initialJsonData = {
  instructions: [
    "Enter your JSON in the editor.",
    "Select an item to view its path.",
    "Replace 'x' with the name of your variable.",
  ],
};

const initialState: InitialState = {
  isDarkMode: false,
  jsonData: initialJsonData,
  jsonText: JSON.stringify(initialJsonData, null, 2),
  path: "",
  copyButtonDisabled: false,
  error: "",
  selectedNode: null,
};

export const appState = new State(initialState);
export type AppState = typeof appState;

export default State;
