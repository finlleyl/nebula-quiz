import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useLiveGame } from "@/features/live-game/store";
import { useServerTimer } from "@/features/live-game/hooks";
import type { QuestionStartPayload, QuestionStats } from "@/shared/lib/ws/protocol";

const LABELS = ["A", "B", "C", "D"];

export default function HostQuestionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    activeQuestion,
    questionResult,
    leaderboard,
    roomState,
    finishedPayload,
    nextQuestion,
    skipQuestion,
  } = useLiveGame();

  // Store the last question so we can still display it during the reveal phase.
  const lastQuestionRef = useRef<QuestionStartPayload | null>(null);
  if (activeQuestion) lastQuestionRef.current = activeQuestion;
  const displayQuestion = activeQuestion ?? lastQuestionRef.current;

  useEffect(() => {
    if (finishedPayload) navigate(`/host/${code}/results`, { replace: true });
  }, [finishedPayload, code, navigate]);

  useEffect(() => {
    if (roomState?.status === "lobby") navigate(`/host/${code}`, { replace: true });
  }, [roomState?.status, code, navigate]);

  if (!displayQuestion) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0C0C1F", color: "#E5E3FF" }}
      >
        <p className="animate-pulse" style={{ color: "#8B8FB8" }}>
          Waiting for question…
        </p>
      </div>
    );
  }

  const isRevealing = questionResult != null;
  const correctIds = questionResult?.correct_option_ids ?? [];
  const stats = questionResult?.stats;
  const totalParticipants = roomState?.participants.length ?? 0;

  return (
    <HostQuestionView
      key={displayQuestion.question_id + (isRevealing ? "-reveal" : "")}
      question={displayQuestion}
      totalParticipants={totalParticipants}
      isRevealing={isRevealing}
      correctIds={correctIds}
      stats={stats}
      leaderboard={leaderboard}
      onNext={nextQuestion}
      onSkip={skipQuestion}
    />
  );
}

// ---- inner component ----

interface HostQuestionViewProps {
  question: QuestionStartPayload;
  totalParticipants: number;
  isRevealing: boolean;
  correctIds: string[];
  stats: QuestionStats | undefined;
  leaderboard: { participant_id: string; nickname: string; score: number }[];
  onNext: () => void;
  onSkip: () => void;
}

function HostQuestionView({
  question,
  totalParticipants,
  isRevealing,
  correctIds,
  stats,
  leaderboard,
  onNext,
  onSkip,
}: HostQuestionViewProps) {
  const { remainingMs, progress } = useServerTimer(
    question.server_ts,
    question.time_limit_ms
  );

  const remainingSec = Math.ceil(remainingMs / 1000);
  const answeredCount = stats?.answered ?? 0;
  const distributionValues = stats ? Object.values(stats.distribution) : [];
  const maxAnswers = distributionValues.length > 0 ? Math.max(1, ...distributionValues) : 1;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      {/* Top nav */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="font-display text-lg font-bold uppercase tracking-widest"
          style={{
            backgroundImage: "linear-gradient(168deg, #A68CFF 0%, #7C4DFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          NEBULA QUIZ
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "#8B8FB8" }}>
            Q {question.index + 1} / {question.total}
          </span>
          {!isRevealing && (
            <span
              className="text-2xl font-display font-bold"
              style={{ color: remainingSec <= 5 ? "#EF4444" : "#8DCDFF" }}
            >
              {remainingSec}s
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 gap-8 px-8 py-8 max-w-6xl mx-auto w-full">
        {/* left: question + bars */}
        <div className="flex-1 flex flex-col gap-6">
          {!isRevealing && (
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, (1 - progress) * 100)}%`,
                  background: remainingSec <= 5 ? "#EF4444" : "#8DCDFF",
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          )}

          <h2
            className="font-display text-2xl font-bold leading-snug"
            style={{ color: "#E5E3FF" }}
          >
            {question.text}
          </h2>

          {/* Answer distribution */}
          <div className="flex flex-col gap-3">
            {question.options.map((opt, i) => {
              const count = stats?.distribution[opt.id] ?? 0;
              const pct = maxAnswers > 0 ? count / maxAnswers : 0;
              const isCorrect = correctIds.includes(opt.id);
              const label = LABELS[i] ?? opt.label;

              return (
                <div key={opt.id} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background:
                        isRevealing && isCorrect ? "rgba(52,211,153,0.20)" : "rgba(255,255,255,0.08)",
                      color: isRevealing && isCorrect ? "#34D399" : "#8B8FB8",
                    }}
                  >
                    {isRevealing && isCorrect ? "✓" : label}
                  </span>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#E5E3FF" }}>
                        {opt.text}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "#A8A7D5" }}>
                        {count}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct * 100}%`,
                          background: isRevealing && isCorrect ? "#34D399" : "#7C4DFF",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 text-sm" style={{ color: "#8B8FB8" }}>
            <span>
              <b style={{ color: "#8DCDFF" }}>{answeredCount}</b> / {totalParticipants} answered
            </span>
            {isRevealing && (
              <span>
                <b style={{ color: "#34D399" }}>{stats?.correct ?? 0}</b> correct
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 mt-auto">
            {!isRevealing ? (
              <button
                onClick={onSkip}
                className="rounded-full px-6 py-3 text-sm font-semibold"
                style={{
                  border: "1px solid rgba(68,68,108,0.30)",
                  color: "#A8A7D5",
                  background: "transparent",
                }}
              >
                Skip Question →
              </button>
            ) : (
              <button
                onClick={onNext}
                className="rounded-full px-8 py-3 text-base font-bold"
                style={{
                  backgroundImage: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 10px 20px 0 rgba(166,139,255,0.20)",
                }}
              >
                {question.index + 1 >= question.total ? "Finish Game ▶" : "Next Question ▶"}
              </button>
            )}
          </div>
        </div>

        {/* right: leaderboard */}
        <aside
          className="w-72 flex flex-col gap-3 rounded-2xl p-5 self-start"
          style={{ background: "#111128", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "#8B8FB8" }}
          >
            Leaderboard
          </h3>
          {leaderboard.length === 0 && (
            <p className="text-xs" style={{ color: "#5C5E85" }}>
              No scores yet
            </p>
          )}
          {leaderboard.slice(0, 8).map((entry, i) => (
            <div
              key={entry.participant_id}
              className="flex items-center gap-3 rounded-full px-4 py-2"
              style={{
                background: i === 0 ? "rgba(124,77,255,0.18)" : "rgba(255,255,255,0.04)",
              }}
            >
              <span
                className="w-6 text-center text-sm font-bold"
                style={{ color: i === 0 ? "#A68CFF" : "#8B8FB8" }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm truncate" style={{ color: "#E5E3FF" }}>
                {entry.nickname}
              </span>
              <span className="text-sm font-bold font-display" style={{ color: "#8DCDFF" }}>
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
