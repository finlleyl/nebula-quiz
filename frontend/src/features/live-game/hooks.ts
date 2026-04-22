import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createGame, type CreateGameResponse } from "./api";

export const HOST_TICKET_KEY = "host_ticket";
export const HOST_ROOM_CODE_KEY = "host_room_code";

export function useHostGame() {
  const navigate = useNavigate();
  return useMutation<CreateGameResponse, Error, string>({
    mutationFn: (quizId: string) => createGame(quizId),
    onSuccess: (res) => {
      sessionStorage.setItem(HOST_TICKET_KEY, res.ws_ticket);
      sessionStorage.setItem(HOST_ROOM_CODE_KEY, res.room_code);
      navigate(`/host/${res.room_code}`);
    },
  });
}

/**
 * Client-side timer synchronised with server_ts from question.start.
 * Uses requestAnimationFrame for smooth progress updates.
 * Returns remainingMs and progress [0..1].
 */
export function useServerTimer(serverStartTs: number, durationMs: number) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    if (durationMs <= 0) return;
    const offset = Date.now() - serverStartTs;
    const clientStart = performance.now();

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - clientStart + offset;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left > 0) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [serverStartTs, durationMs]);

  return { remainingMs: remaining, progress: 1 - remaining / durationMs };
}
