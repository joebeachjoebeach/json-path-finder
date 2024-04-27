export type JSONPrimitive = null | string | number | boolean;
export type JSONValue = JSONPrimitive | JSONObjOrArr;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONObjOrArr = JSONObject | JSONValue[];
