/**
 * Utility function to create a loggable string from a thrown value. Thrown
 * values can be of any type.
 */
export function serializeError(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err?.toString === "function") {
    // we make a runtime check that result of toString is meaningful
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const stringValue = err.toString();
    if (stringValue !== "[object Object]") {
      return stringValue;
    }
  }
  if (typeof err === "undefined") {
    return "undefined";
  }
  return JSON.stringify(err);
}
