/**
 * Deep clones an object using structuredClone (if available) or JSON serialization.
 *
 * @param obj - The object to clone
 * @returns A deep copy of the object
 */
export const deepClone = function <T>(obj: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
};
