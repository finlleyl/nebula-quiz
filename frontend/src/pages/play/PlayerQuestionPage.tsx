import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useLiveGame } from "@/features/live-game/store";
import { useServerTimer } from "@/features/live-game/hooks";
import type { QuestionStartPayload, QuestionEndPayload } from "@/shared/lib/ws/protocol";

const LABELS = ["A", "B", "C", "D"];

export default function PlayerQuestionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    activeQuestion, questionResult, myAnswer, myScore, finishedPayload,
    powerupsLeft, hiddenOptionIds,
    submitAnswer, usePowerup,
  } = useLiveGame();

  // Navigate to results when game ends.
  useEffect(() => {
    if (finishedPayload) {
      navigate(`/play/${code}/results`, { replace: true });
    }
  }, [finishedPayload, code, navigate]);

  if (!activeQuestion) {
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

  return (
    <PlayerQuestion
      key={activeQuestion.question_id}
      activeQuestion={activeQuestion}
      questionResult={questionResult}
      myAnswer={myAnswer}
      myScore={myScore}
      powerupsLeft={powerupsLeft}
      hiddenOptionIds={hiddenOptionIds}
      onSubmit={submitAnswer}
      onUsePowerup={() => usePowerup("fifty_fifty")}
    />
  );
}

// ---- inner component (re-mounts per question via key) ----

interface PlayerQuestionProps {
  activeQuestion: QuestionStartPayload;
  questionResult: QuestionEndPayload | null;
  myAnswer: string[] | null;
  myScore: number;
  powerupsLeft: number;
  hiddenOptionIds: string[];
  onSubmit: (optionIds: string[]) => void;
  onUsePowerup: () => void;
}

function PlayerQuestion({
  activeQuestion,
  questionResult,
  myAnswer,
  myScore,
  powerupsLeft,
  hiddenOptionIds,
  onSubmit,
  onUsePowerup,
}: PlayerQuestionProps) {
  const { remainingMs, progress } = useServerTimer(
    activeQuestion.server_ts,
    activeQuestion.time_limit_ms
  );

  const remainingSec = Math.ceil(remainingMs / 1000);
  const isRevealing = questionResult != null;
  const correctIds = questionResult?.correct_option_ids ?? [];
  const answered = myAnswer !== null;
  const disabled = answered || isRevealing || remainingMs <= 0;

  function optionState(optId: string): "default" | "selected" | "correct" | "wrong" {
    if (!isRevealing) {
      return myAnswer?.includes(optId) ? "selected" : "default";
    }
    const isCorrect = correctIds.includes(optId);
    const wasSelected = myAnswer?.includes(optId) ?? false;
    if (isCorrect) return "correct";
    if (wasSelected && !isCorrect) return "wrong";
    return "default";
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0C0C1F", color: "#E5E3FF" }}
    >
      {/* header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase"
          style={{ background: "rgba(141,205,255,0.10)", color: "#8DCDFF" }}
        >
          <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
          Q. {activeQuestion.index + 1}/{activeQuestion.total}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "rgba(255,183,120,0.12)", color: "#FFB778" }}
        >
          ⭐ {myScore.toLocaleString()} pts
        </span>
      </header>

      {/* main */}
      <main className="flex flex-1 flex-col items-center gap-8 px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Progress bar (time remaining) */}
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

        {/* Countdown number */}
        <div className="text-center">
          <div
            className="font-display font-bold leading-none"
            style={{ fontSize: 80, color: remainingSec <= 5 ? "#EF4444" : "#E5E3FF" }}
          >
            {remainingSec}
          </div>
          <div
            className="text-xs uppercase tracking-widest"
            style={{ color: "#8B8FB8" }}
          >
            SECONDS
          </div>
        </div>

        {/* Question text */}
        <p
          className="text-center font-display text-xl font-bold leading-snug"
          style={{ color: "#E5E3FF" }}
        >
          {activeQuestion.text}
        </p>

        {/* 2×2 answer grid — hidden options are faded out (fifty_fifty effect) */}
        <div className="w-full grid grid-cols-2 gap-3">
          {activeQuestion.options.map((opt, i) => {
            const isHidden = hiddenOptionIds.includes(opt.id) && !isRevealing;
            const state = optionState(opt.id);
            const label = LABELS[i] ?? String.fromCharCode(65 + i);
            return (
              <button
                key={opt.id}
                disabled={disabled || isHidden}
                onClick={() => onSubmit([opt.id])}
                className="flex items-center gap-3 rounded-full px-5 py-4 text-left transition-all disabled:cursor-not-allowed"
                style={{
                  opacity: isHidden ? 0.25 : 1,
                  background:
                    state === "correct"
                      ? "rgba(52,211,153,0.15)"
                      : state === "wrong"
                      ? "rgba(239,68,68,0.15)"
                      : state === "selected"
                      ? "rgba(124,77,255,0.18)"
                      : "#111128",
                  border:
                    state === "correct"
                      ? "1.5px solid #34D399"
                      : state === "wrong"
                      ? "1.5px solid #EF4444"
                      : state === "selected"
                      ? "1.5px solid #7C4DFF"
                      : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background:
                      state === "correct"
                        ? "rgba(52,211,153,0.25)"
                        : state === "wrong"
                        ? "rgba(239,68,68,0.25)"
                        : state === "selected"
                        ? "rgba(124,77,255,0.30)"
                        : "rgba(255,255,255,0.08)",
                    color:
                      state === "correct"
                        ? "#34D399"
                        : state === "wrong"
                        ? "#EF4444"
                        : state === "selected"
                        ? "#A68CFF"
                        : "#8B8FB8",
                  }}
                >
                  {state === "correct" ? "✓" : state === "wrong" ? "✗" : label}
                </span>
                <span className="text-sm font-medium" style={{ color: "#E5E3FF" }}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Power-up button — spec §13, bottom-right corner style */}
        {!isRevealing && !answered && activeQuestion.type === "single" && (
          <div className="self-end flex items-center gap-2">
            <button
              onClick={onUsePowerup}
              disabled={powerupsLeft <= 0}
              title={powerupsLeft > 0 ? "50/50: hide 2 wrong answers" : "No power-ups left"}
              className="relative flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: powerupsLeft > 0 ? "rgba(255,183,120,0.15)" : "rgba(255,255,255,0.05)",
                border: powerupsLeft > 0 ? "1.5px solid #FFB778" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              ⚡
              <span
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: "#FFB778", color: "#0C0C1F" }}
              >
                {powerupsLeft}
              </span>
            </button>
            <span className="text-xs" style={{ color: "#8B8FB8" }}>50/50</span>
          </div>
        )}

        {/* Feedback */}
        {answered && !isRevealing && (
          <p className="text-sm" style={{ color: "#A8A7D5" }}>
            Answer submitted — waiting for results…
          </p>
        )}
        {isRevealing && questionResult && (
          <p
            className="text-base font-semibold"
            style={{
              color: questionResult.my_result.is_correct ? "#34D399" : "#EF4444",
            }}
          >
            {questionResult.my_result.is_correct
              ? `+${questionResult.my_result.score_awarded} pts`
              : "Not quite!"}
          </p>
        )}
      </main>
    </div>
  );
}
