function fallbackRandomSegment() {
  return Math.random().toString(16).slice(2, 10);
}

export function createIdempotencyKey() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return [
    "flare",
    Date.now().toString(16),
    fallbackRandomSegment(),
    fallbackRandomSegment(),
  ].join("-");
}
