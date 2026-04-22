import { create } from "zustand";
import {
  GameFinishedPayload,
  LeaderboardUpdatePayload,
  QuestionEndPayload,
  QuestionStartPayload,
  RoomStatePayload,
  ServerMessage,
} from "@/shared/lib/ws/protocol";
import { quizSocket } from "./ws-client";

export interface LiveGameState {
  roomState: RoomStatePayload | null;
  activeQuestion: QuestionStartPayload | null;
  leaderboard: LeaderboardUpdatePayload | null;
  gameFinished: GameFinishedPayload | null;
  myAnswer: string[] | null;
  myResult: QuestionEndPayload["my_result"] | null;
  myScore: number;

  handle: (msg: ServerMessage) => void;
  submitAnswer: (optionIds: string[]) => void;
  reset: () => void;
}

export const useLiveGame = create<LiveGameState>((set, get) => ({
  roomState: null,
  activeQuestion: null,
  leaderboard: null,
  gameFinished: null,
  myAnswer: null,
  myResult: null,
  myScore: 0,

  handle: (msg) => {
    switch (msg.type) {
      case "room.state":
        set({ roomState: msg.payload });
        break;
      case "question.start":
        // Never expose correct_option_ids at this stage — payload has none per spec.
        set({ activeQuestion: msg.payload, myAnswer: null, myResult: null });
        break;
      case "question.end":
        set((s) => ({
          myResult: msg.payload.my_result,
          myScore: s.myScore + (msg.payload.my_result?.score_awarded ?? 0),
        }));
        break;
      case "leaderboard.update":
        set({ leaderboard: msg.payload });
        break;
      case "game.finished":
        set({ gameFinished: msg.payload });
        break;
      case "participant.joined":
        set((s) => {
          if (!s.roomState) return {};
          return {
            roomState: {
              ...s.roomState,
              participants: [
                ...s.roomState.participants,
                msg.payload.participant,
              ],
            },
          };
        });
        break;
      case "participant.left":
        set((s) => {
          if (!s.roomState) return {};
          return {
            roomState: {
              ...s.roomState,
              participants: s.roomState.participants.filter(
                (p) => p.id !== msg.payload.participant_id
              ),
            },
          };
        });
        break;
      case "participant.status":
        set((s) => {
          if (!s.roomState) return {};
          return {
            roomState: {
              ...s.roomState,
              participants: s.roomState.participants.map((p) =>
                p.id === msg.payload.participant_id
                  ? { ...p, status: msg.payload.status }
                  : p
              ),
            },
          };
        });
        break;
    }
  },

  submitAnswer: (optionIds) => {
    const q = get().activeQuestion;
    if (!q || get().myAnswer) return;
    set({ myAnswer: optionIds });
    quizSocket.send({
      type: "answer.submit",
      payload: { question_id: q.question_id, option_ids: optionIds },
    });
  },

  reset: () =>
    set({
      roomState: null,
      activeQuestion: null,
      leaderboard: null,
      gameFinished: null,
      myAnswer: null,
      myResult: null,
      myScore: 0,
    }),
}));
