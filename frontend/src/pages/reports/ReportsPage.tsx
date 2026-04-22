import { useQuery } from "@tanstack/react-query";
import { Trophy, Clock, Users } from "lucide-react";

import { api } from "@/shared/lib/http";
import { DashboardSidebar } from "@/pages/dashboard/DashboardSidebar";

interface HistoryEntry {
  session_id: string;
  room_code: string;
  match_number: number | null;
  status: string;
  finished_at: string | null;
  quiz_title: string;
  total_score: number;
  rank: number;
  total_participants: number;
}

function useHistory() {
  return useQuery<HistoryEntry[]>({
    queryKey: ["me", "history"],
    queryFn: () => api.get("me/history").json<HistoryEntry[]>(),
  });
}

function rankLabel(rank: number, total: number) {
  if (rank === 1) return "🥇 1st";
  if (rank === 2) return "🥈 2nd";
  if (rank === 3) return "🥉 3rd";
  return `#${rank} of ${total}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const { data: entries, isPending, isError } = useHistory();

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      <DashboardSidebar />

      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1
            className="font-display font-bold"
            style={{ fontSize: 32, color: "#E5E3FF", letterSpacing: "-0.5px" }}
          >
            Match History
          </h1>
          <p style={{ color: "#A8A7D5", marginTop: 4 }}>
            Your recent quiz sessions
          </p>
        </div>

        {isPending && (
          <p style={{ color: "#8B8FB8" }}>Loading history…</p>
        )}

        {isError && (
          <p style={{ color: "#EF4444" }}>Failed to load history.</p>
        )}

        {!isPending && !isError && entries?.length === 0 && (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
              color: "#5C5E85",
            }}
          >
            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
            <p style={{ fontSize: 18, fontWeight: 600 }}>No matches yet</p>
            <p style={{ marginTop: 8, fontSize: 14 }}>
              Join a game to see your history here.
            </p>
          </div>
        )}

        {entries && entries.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.map((e) => (
              <div
                key={e.session_id}
                style={{
                  background: "#111128",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                {/* Left: quiz name + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: 16,
                      color: "#E5E3FF",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.quiz_title}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        color: "#8B8FB8",
                      }}
                    >
                      <Clock size={12} />
                      {formatDate(e.finished_at)}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: "#5C5E85",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {e.room_code}
                    </span>
                    {e.match_number != null && (
                      <span style={{ fontSize: 12, color: "#5C5E85" }}>
                        Match #{e.match_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: rank */}
                <div style={{ textAlign: "center", minWidth: 100 }}>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: e.rank === 1 ? "#FFB778" : e.rank <= 3 ? "#8DCDFF" : "#A8A7D5",
                    }}
                  >
                    {rankLabel(e.rank, e.total_participants)}
                  </p>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      fontSize: 12,
                      color: "#8B8FB8",
                      marginTop: 2,
                    }}
                  >
                    <Users size={12} />
                    {e.total_participants} players
                  </p>
                </div>

                {/* Right: score */}
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 22,
                      color: "#8DCDFF",
                    }}
                  >
                    {e.total_score.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 12, color: "#8B8FB8", marginTop: 2 }}>
                    pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
