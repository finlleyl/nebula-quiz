import { create } from "zustand";
import type {
  ParticipantSummary,
  QuestionStartPayload,
  QuestionEndPayload,
  LeaderboardEntry,
  GameFinishedPayload,
  RoomStatePayload,
  ServerMessage,
} from "@/shared/lib/ws/protocol";
import { quizSocket } from "./ws-client";

interface LiveGameState {
  roomState: RoomStatePayload | null;
  activeQuestion: QuestionStartPayload | null;
  questionResult: QuestionEndPayload | null;
  leaderboard: LeaderboardEntry[];
  myAnswer: string[] | null;
  myScore: number;
  myRank: number;
  myParticipantId: string | null;
  finishedPayload: GameFinishedPayload | null;

  // Actions
  connectAsHost: (wsUrl: string) => void;
  connectAsPlayer: (wsUrl: string, participantId: string) => void;
  handle: (msg: ServerMessage) => void;
  submitAnswer: (optionIds: string[]) => void;
  sendReady: () => void;
  startGame: () => void;
  nextQuestion: () => void;
  skipQuestion: () => void;
  disconnect: () => void;
}

export const useLiveGame = create<LiveGameState>((set, get) => ({
  roomState: null,
  activeQuestion: null,
  questionResult: null,
  leaderboard: [],
  myAnswer: null,
  myScore: 0,
  myRank: 0,
  myParticipantId: null,
  finishedPayload: null,

  connectAsHost(wsUrl) {
    quizSocket.connect(wsUrl);
    quizSocket.on((msg) => get().handle(msg));
  },

  connectAsPlayer(wsUrl, participantId) {
    set({ myParticipantId: participantId });
    quizSocket.connect(wsUrl);
    quizSocket.on((msg) => get().handle(msg));
  },

  handle(msg) {
    switch (msg.type) {
      case "room.state":
        set({ roomState: msg.payload });
        break;

      case "participant.joined": {
        const rs = get().roomState;
        if (!rs) break;
        const already = rs.participants.some(
          (p) => p.id === msg.payload.participant.id
        );
        if (!already) {
          set({
            roomState: {
              ...rs,
              participants: [...rs.participants, msg.payload.participant],
            },
          });
        }
        break;
      }

      case "participant.left": {
        const rs = get().roomState;
        if (!rs) break;
        set({
          roomState: {
            ...rs,
            participants: rs.participants.filter(
              (p: ParticipantSummary) => p.id !== msg.payload.participant_id
            ),
          },
        });
        break;
      }

      case "participant.status": {
        const rs = get().roomState;
        if (!rs) break;
        set({
          roomState: {
            ...rs,
            participants: rs.participants.map((p: ParticipantSummary) =>
              p.id === msg.payload.participant_id
                ? { ...p, status: msg.payload.status }
                : p
            ),
          },
        });
        break;
      }

      case "question.start":
        set({
          activeQuestion: msg.payload,
          questionResult: null,
          myAnswer: null,
        });
        break;

      case "question.end":
        set({
          questionResult: msg.payload,
          myScore: msg.payload.my_result.total_score,
        });
        break;

      case "leaderboard.update":
        set({
          leaderboard: msg.payload.top,
          myRank: msg.payload.my_rank,
          myScore: msg.payload.my_score,
        });
        break;

      case "game.finished":
        set({ finishedPayload: msg.payload });
        break;

      default:
        break;
    }
  },

  submitAnswer(optionIds) {
    const q = get().activeQuestion;
    if (!q || get().myAnswer) return;
    set({ myAnswer: optionIds });
    quizSocket.send({
      type: "answer.submit",
      payload: { question_id: q.question_id, option_ids: optionIds },
    });
  },

  sendReady() {
    quizSocket.send({ type: "participant.ready" });
  },

  startGame() {
    quizSocket.send({ type: "host.start_game" });
  },

  nextQuestion() {
    quizSocket.send({ type: "host.next_question" });
  },

  skipQuestion() {
    quizSocket.send({ type: "host.skip_question" });
  },

  disconnect() {
    quizSocket.close();
    set({
      roomState: null,
      activeQuestion: null,
      questionResult: null,
      leaderboard: [],
      myAnswer: null,
      myScore: 0,
      myRank: 0,
      myParticipantId: null,
      finishedPayload: null,
    });
  },
}));
