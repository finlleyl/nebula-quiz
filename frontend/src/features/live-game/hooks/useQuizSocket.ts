import { useEffect } from "react";
import { quizSocket } from "../ws-client";
import { useLiveGame } from "../store";

const WS_BASE =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  (typeof window !== "undefined"
    ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`
    : "ws://localhost:8080/ws");

/**
 * Connects to the WS server using a ticket, wires incoming messages to the
 * live-game store, and cleans up on unmount.
 */
export function useQuizSocket(ticket: string | null) {
  const handle = useLiveGame((s) => s.handle);

  useEffect(() => {
    if (!ticket) return;

    const url = `${WS_BASE}?ticket=${encodeURIComponent(ticket)}`;
    quizSocket.connect(url);
    const off = quizSocket.on(handle);

    return () => {
      off();
      quizSocket.close();
    };
  }, [ticket, handle]);
}
