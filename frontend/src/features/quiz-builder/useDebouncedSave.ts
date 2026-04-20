import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounces `value` and calls the current `onFlush` when it stabilises.
 * Skips the initial mount so hydration from server doesn't retrigger a save.
 * `onFlush` is captured in a ref to avoid stale closures when the parent
 * re-renders a new callback while a save is already pending.
 */
export function useDebouncedSave<T>(
  value: T,
  onFlush: (v: T) => Promise<unknown>,
  delayMs = 600,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const firstRender = useRef(true);
  const lastSerialized = useRef<string>(JSON.stringify(value));
  const flushRef = useRef(onFlush);

  useEffect(() => {
    flushRef.current = onFlush;
  });

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      lastSerialized.current = JSON.stringify(value);
      return;
    }
    const serialized = JSON.stringify(value);
    if (serialized === lastSerialized.current) return;

    setStatus("saving");
    const handle = setTimeout(async () => {
      try {
        await flushRef.current(value);
        lastSerialized.current = serialized;
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1200);
      } catch {
        setStatus("error");
      }
    }, delayMs);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  return status;
}
