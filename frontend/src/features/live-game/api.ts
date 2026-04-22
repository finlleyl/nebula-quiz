import { api } from "@/shared/lib/http";

export interface CreateGameResponse {
  game_id: string;
  room_code: string;
  match_number: number;
  ws_ticket: string;
}

export interface JoinGameResponse {
  game_id: string;
  participant_id: string;
  room_code: string;
  ws_ticket: string;
}

export function createGame(quizId: string): Promise<CreateGameResponse> {
  return api.post("games", { json: { quiz_id: quizId } }).json();
}

export function joinGame(
  code: string,
  nickname: string,
  avatarUrl?: string
): Promise<JoinGameResponse> {
  return api
    .post(`games/by-code/${code}/join`, {
      json: { nickname, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) },
    })
    .json();
}

/** Build the WebSocket URL from a short-lived ticket. */
export function buildWsUrl(ticket: string): string {
  const base =
    import.meta.env.VITE_WS_BASE ??
    (window.location.protocol === "https:" ? "wss://" : "ws://") +
      window.location.host;
  return `${base}/ws?ticket=${encodeURIComponent(ticket)}`;
}
