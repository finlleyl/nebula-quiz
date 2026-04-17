/**
 * WebSocket wire protocol — single source of truth for the frontend.
 * Mirror of spec §9 and backend/internal/realtime/protocol.go.
 *
 * Use the discriminated unions below so a `switch (msg.type)` in the
 * live-game store gets exhaustive type narrowing.
 */

// ---------- Shared enums ------------------------------------------------

export type RoomStatus = "lobby" | "in_progress" | "finished" | "aborted";

export type ParticipantStatus = "joined" | "ready" | "vip" | "left";

export type QuestionKind = "single" | "multiple";

export type PowerupType = "fifty_fifty" | "double";

// ---------- Shared record shapes ---------------------------------------

export interface QuizSummary {
  title: string;
  total_questions: number;
}

export interface HostSummary {
  display_name: string;
  avatar_url?: string | null;
}

export interface ParticipantSummary {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  status: ParticipantStatus;
  score: number;
}

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface QuestionStats {
  answered: number;
  correct: number;
  distribution: Record<string, number>;
}

export interface LeaderboardEntry {
  participant_id: string;
  nickname: string;
  avatar_url?: string | null;
  score: number;
}

export interface PodiumEntry {
  rank: number;
  nickname: string;
  score: number;
  avatar_url?: string | null;
}

// ---------- Client → Server --------------------------------------------

export type ClientMessage =
  | { type: "auth"; payload: { ticket: string } }
  | { type: "room.join"; payload: { room_code: string } }
  | { type: "participant.ready" }
  | {
      type: "answer.submit";
      payload: { question_id: string; option_ids: string[] };
    }
  | { type: "powerup.use"; payload: { type: PowerupType } }
  | { type: "host.start_game" }
  | { type: "host.next_question" }
  | { type: "host.skip_question" }
  | { type: "host.end_game" };

export type ClientMessageType = ClientMessage["type"];

// ---------- Server → Client --------------------------------------------

export interface AuthOkPayload {
  user_id: string;
  is_guest: boolean;
}

export interface RoomStatePayload {
  room_code: string;
  status: RoomStatus;
  quiz: QuizSummary;
  host: HostSummary;
  participants: ParticipantSummary[];
  current_question_index: number | null;
}

export interface QuestionStartPayload {
  question_id: string;
  index: number;
  total: number;
  text: string;
  image_url?: string | null;
  type: QuestionKind;
  options: QuestionOption[];
  time_limit_ms: number;
  server_ts: number;
}

export interface QuestionEndPayload {
  question_id: string;
  correct_option_ids: string[];
  stats: QuestionStats;
  my_result: {
    is_correct: boolean;
    score_awarded: number;
    total_score: number;
  };
}

export interface LeaderboardUpdatePayload {
  top: LeaderboardEntry[];
  my_rank: number;
  my_score: number;
}

export interface GameFinishedPayload {
  match_number: number;
  podium: PodiumEntry[];
  runner_ups: PodiumEntry[];
  me: { rank: number; score: number };
}

export interface PowerupAppliedPayload {
  type: PowerupType;
  hidden_option_ids: string[];
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export type ServerMessage =
  | { type: "auth.ok"; payload: AuthOkPayload }
  | { type: "room.state"; payload: RoomStatePayload }
  | { type: "participant.joined"; payload: { participant: ParticipantSummary } }
  | { type: "participant.left"; payload: { participant_id: string } }
  | {
      type: "participant.status";
      payload: { participant_id: string; status: ParticipantStatus };
    }
  | { type: "question.start"; payload: QuestionStartPayload }
  | { type: "question.tick"; payload: { remaining_ms: number } }
  | { type: "question.end"; payload: QuestionEndPayload }
  | { type: "leaderboard.update"; payload: LeaderboardUpdatePayload }
  | { type: "powerup.applied"; payload: PowerupAppliedPayload }
  | { type: "game.finished"; payload: GameFinishedPayload }
  | { type: "error"; payload: ErrorPayload };

export type ServerMessageType = ServerMessage["type"];

// ---------- Helpers -----------------------------------------------------

/**
 * Encode a client message for sending over the socket.
 * Intentionally tiny — wire format is JSON, one message per frame.
 */
export function encode(msg: ClientMessage): string {
  return JSON.stringify(msg);
}

/**
 * Decode a server frame. Returns null for malformed JSON or unknown types;
 * callers should treat null as a protocol error and ignore the frame.
 */
export function decode(raw: string): ServerMessage | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.type === "string") {
      return parsed as ServerMessage;
    }
    return null;
  } catch {
    return null;
  }
}
