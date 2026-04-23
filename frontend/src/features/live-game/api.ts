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

export interface ActiveSession {
  session_id: string;
  room_code: string;
  match_number: number | null;
  status: "lobby" | "in_progress";
  created_at: string;
  started_at: string | null;
  quiz_id: string;
  quiz_title: string;
  participant_count: number;
}

export interface ResumeGameResponse {
  game_id: string;
  room_code: string;
  match_number: number;
  status: "lobby" | "in_progress";
  ws_ticket: string;
}

export function listActiveSessions(): Promise<ActiveSession[]> {
  return api.get("me/sessions").json<ActiveSession[]>();
}

export function resumeGame(sessionId: string): Promise<ResumeGameResponse> {
  return api.post(`games/${sessionId}/resume`).json<ResumeGameResponse>();
}

/** Build the WebSocket URL from a short-lived ticket. */
export function buildWsUrl(ticket: string): string {
  const base =
    import.meta.env.VITE_WS_BASE ??
    (window.location.protocol === "https:" ? "wss://" : "ws://") +
      window.location.host;
  return `${base}/ws?ticket=${encodeURIComponent(ticket)}`;
}
