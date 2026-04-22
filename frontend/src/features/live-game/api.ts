import { api } from "@/shared/lib/http";

export interface CreateGameResponse {
  game_id: string;
  room_code: string;
  match_number: number | null;
}

export interface JoinGameResponse {
  game_id: string;
  participant_id: string;
  ws_ticket: string;
}

export interface HostTicketResponse {
  ws_ticket: string;
}

export const gameApi = {
  create: (quizId: string) =>
    api.post("games", { json: { quiz_id: quizId } }).json<CreateGameResponse>(),

  join: (code: string, nickname: string, avatarUrl?: string) =>
    api
      .post(`games/by-code/${code}/join`, {
        json: { nickname, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) },
      })
      .json<JoinGameResponse>(),

  hostTicket: (gameId: string) =>
    api.post(`games/${gameId}/host-ticket`).json<HostTicketResponse>(),
};
