import { api } from "@/shared/lib/http";

export interface Overview {
  total_players: number;
  active_sessions: number;
  avg_completion_rate: number;
  total_quizzes: number;
  total_sessions: number;
  finished_sessions: number;
  avg_score: number;
  avg_players_per_game: number;
}

export interface TopQuiz {
  quiz_id: string;
  title: string;
  sessions_count: number;
  players_count: number;
  avg_score: number;
}

export interface RecentSession {
  session_id: string;
  room_code: string;
  quiz_title: string;
  status: "lobby" | "in_progress" | "finished";
  finished_at: string | null;
  started_at: string | null;
  players_count: number;
  avg_score: number;
}

export interface AnalyticsReport {
  overview: Overview;
  top_quizzes: TopQuiz[];
  recent_sessions: RecentSession[];
}

export function getAnalyticsOverview(): Promise<AnalyticsReport> {
  return api.get("analytics/overview").json<AnalyticsReport>();
}
