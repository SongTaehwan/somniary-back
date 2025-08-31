export const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  // Handle object types by serializing to JSON
  if (typeof error === "object" && error !== null) {
    try {
      return new Error(JSON.stringify(error));
    } catch {
      // Fallback if JSON.stringify fails (circular references, etc.)
      return new Error(`[Object: ${Object.prototype.toString.call(error)}]`);
    }
  }

  return new Error(String(error));
};
