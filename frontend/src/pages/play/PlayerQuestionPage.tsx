import { Check, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useLiveGame } from "@/features/live-game/store";
import { useServerTimer } from "@/features/live-game/hooks";
import type { QuestionStartPayload, QuestionEndPayload } from "@/shared/lib/ws/protocol";
import { Avatar } from "@/shared/ui/Avatar";
import { cn } from "@/shared/lib/utils";

const LETTERS = ["A", "Б", "В", "Г"];
const COLORS = ["#0077FF", "#4BB34B", "#FF9900", "#E64646"];

export default function PlayerQuestionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    activeQuestion,
    questionResult,
    myAnswer,
    myScore,
    myRank,
    leaderboard,
    finishedPayload,
    powerupsLeft,
    hiddenOptionIds,
    submitAnswer,
    usePowerup,
    myParticipantId,
  } = useLiveGame();

  useEffect(() => {
    if (finishedPayload) navigate(`/play/${code}/results`, { replace: true });
  }, [finishedPayload, code, navigate]);

  if (!activeQuestion) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-page">
        <p className="animate-pulse text-text-secondary">Ожидаем вопрос…</p>
      </div>
    );
  }

  const me = leaderboard.find((e) => e.participant_id === myParticipantId);
  const myNick = me?.nickname ?? "Вы";

  return (
    <PlayerQuestion
      key={activeQuestion.question_id}
      activeQuestion={activeQuestion}
      questionResult={questionResult}
      myAnswer={myAnswer}
      myScore={myScore}
      myRank={myRank}
      myNick={myNick}
      powerupsLeft={powerupsLeft}
      hiddenOptionIds={hiddenOptionIds}
      leaderboard={leaderboard}
      myParticipantId={myParticipantId}
      onSubmit={submitAnswer}
      onUsePowerup={() => usePowerup("fifty_fifty")}
    />
  );
}

interface PlayerQuestionProps {
  activeQuestion: QuestionStartPayload;
  questionResult: QuestionEndPayload | null;
  myAnswer: string[] | null;
  myScore: number;
  myRank: number;
  myNick: string;
  powerupsLeft: number;
  hiddenOptionIds: string[];
  leaderboard: { participant_id: string; nickname: string; score: number }[];
  myParticipantId: string | null;
  onSubmit: (optionIds: string[]) => void;
  onUsePowerup: () => void;
}

function PlayerQuestion({
  activeQuestion,
  questionResult,
  myAnswer,
  myScore,
  myRank,
  myNick,
  powerupsLeft,
  hiddenOptionIds,
  leaderboard,
  myParticipantId,
  onSubmit,
  onUsePowerup,
}: PlayerQuestionProps) {
  const { remainingMs, progress } = useServerTimer(
    activeQuestion.server_ts,
    activeQuestion.time_limit_ms,
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
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
        <span className="chip chip-accent px-3 py-1.5 text-[13px]">
          Вопрос {activeQuestion.index + 1} из {activeQuestion.total}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-pill bg-bg-muted px-3.5 py-1.5">
          <Avatar name={myNick} size={24} />
          <span className="text-[13px] font-semibold">{myNick}</span>
        </div>
        <div className="flex items-center gap-2 rounded-pill bg-[#FFF8E5] px-3.5 py-1.5 font-bold text-[#B07900]">
          <Star className="size-4 fill-gold text-gold" />
          <span className="font-mono text-[13px]">
            {myScore.toLocaleString("ru-RU")}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-pill bg-accent-softer px-3.5 py-1.5 font-bold text-accent">
          <Trophy className="size-4" />
          <span className="text-[13px]">
            {myRank > 0 ? `${myRank} место` : "—"}
          </span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
        <main className="flex flex-col gap-7 overflow-auto px-12 py-8">
          <div>
            <div className="h-2.5 overflow-hidden rounded-pill bg-bg-muted">
              <div
                className="h-full rounded-pill"
                style={{
                  width: `${Math.max(0, (1 - progress) * 100)}%`,
                  background:
                    remainingSec <= 5
                      ? "var(--danger)"
                      : "linear-gradient(90deg, var(--accent), #5EB0FF)",
                  transition: "width 0.1s linear",
                }}
              />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-display text-[56px] font-extrabold leading-none tracking-[-0.02em]"
                  style={{
                    color:
                      remainingSec <= 5 ? "var(--danger)" : "var(--accent)",
                  }}
                >
                  {Math.max(0, remainingSec)}
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.1em] text-text-secondary">
                  секунд
                </span>
              </div>
              {isRevealing && questionResult ? (
                <span
                  className={cn(
                    "text-base font-semibold",
                    questionResult.my_result.is_correct
                      ? "text-success"
                      : "text-danger",
                  )}
                >
                  {questionResult.my_result.is_correct
                    ? `+${questionResult.my_result.score_awarded} очков`
                    : "Мимо"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="card p-10 text-center">
            <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.1em] text-accent">
              Вопрос · до 1000 баллов
            </div>
            <h1 className="font-display text-[40px] font-extrabold leading-[1.2] tracking-[-0.02em]">
              {activeQuestion.text}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {activeQuestion.options.map((opt, i) => {
              const isHidden =
                hiddenOptionIds.includes(opt.id) && !isRevealing;
              const state = optionState(opt.id);
              const color = COLORS[i % COLORS.length];
              const letter = LETTERS[i] ?? String.fromCharCode(65 + i);
              const active = state === "selected" || state === "correct";
              const textColor = active ? "#fff" : "var(--text-primary)";
              const bg =
                state === "correct"
                  ? "var(--success)"
                  : state === "wrong"
                    ? "var(--danger)"
                    : state === "selected"
                      ? color
                      : "#fff";
              return (
                <button
                  key={opt.id}
                  disabled={disabled || isHidden}
                  onClick={() => onSubmit([opt.id])}
                  className="flex items-center gap-4 rounded-lg p-[18px_22px] text-left transition-all disabled:cursor-not-allowed"
                  style={{
                    background: bg,
                    color: textColor,
                    opacity: isHidden ? 0.25 : 1,
                    boxShadow: active
                      ? `0 10px 28px ${color}55`
                      : "var(--shadow-card)",
                    transform: active ? "translateY(-2px)" : "none",
                  }}
                >
                  <div
                    className="grid size-11 place-items-center rounded-md font-display text-xl font-extrabold text-white"
                    style={{
                      background: active ? "rgba(255,255,255,0.22)" : color,
                    }}
                  >
                    {letter}
                  </div>
                  <div className="flex-1 text-lg font-semibold">
                    {opt.text}
                  </div>
                  {active ? (
                    <div
                      className="grid size-8 place-items-center rounded-full bg-white"
                      style={{ color }}
                    >
                      <Check className="size-[18px]" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="size-6 rounded-full border-2 border-border-strong" />
                  )}
                </button>
              );
            })}
          </div>
        </main>

        <aside className="flex flex-col gap-[18px] overflow-auto border-l border-divider bg-bg-surface p-5">
          <div>
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
              Таблица лидеров
            </div>
            {leaderboard.slice(0, 6).map((entry, i) => {
              const me = entry.participant_id === myParticipantId;
              return (
                <div
                  key={entry.participant_id}
                  className={cn(
                    "mb-1 flex items-center gap-2.5 rounded-md p-2.5",
                    me
                      ? "bg-accent-softer ring-1 ring-accent/20"
                      : "",
                  )}
                >
                  <div
                    className={cn(
                      "w-6 text-center font-display font-extrabold",
                      i < 3 ? "text-accent" : "text-text-tertiary",
                    )}
                  >
                    {i + 1}
                  </div>
                  <Avatar name={entry.nickname} size={32} />
                  <div
                    className={cn(
                      "flex-1 text-[13px]",
                      me ? "font-bold" : "font-medium",
                    )}
                  >
                    {entry.nickname}
                    {me ? " (Вы)" : ""}
                  </div>
                  <div
                    className={cn(
                      "font-mono text-[13px] font-bold",
                      me ? "text-accent" : "",
                    )}
                  >
                    {entry.score.toLocaleString("ru-RU")}
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="divider" />

          <div>
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
              Бонусы
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onUsePowerup}
                disabled={powerupsLeft <= 0 || isRevealing || answered}
                className="flex flex-col gap-2 rounded-md border border-warning/30 p-3.5 text-left disabled:opacity-55"
                style={{
                  background:
                    "linear-gradient(135deg, #FFF4E0, #FFE4B0)",
                }}
              >
                <div className="grid size-9 place-items-center rounded-[10px] bg-warning">
                  <Zap className="size-5 fill-white text-white" />
                </div>
                <div className="text-[13px] font-bold">50 / 50</div>
                <div className="text-[11px] text-text-secondary">
                  {powerupsLeft > 0 ? "Уберёт 2 неверных" : "Использовано"}
                </div>
              </button>
              <div className="flex flex-col gap-2 rounded-md bg-bg-muted p-3.5 opacity-55">
                <div className="grid size-9 place-items-center rounded-[10px] bg-text-tertiary">
                  <Sparkles className="size-[18px] text-white" />
                </div>
                <div className="text-[13px] font-bold">×2 балла</div>
                <div className="text-[11px] text-text-secondary">
                  Недоступно
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="rounded-md bg-bg-muted p-3 text-xs leading-snug text-text-secondary">
            💡 Чем быстрее ответ — тем больше баллов. Минимум 500, максимум
            1000 за вопрос.
          </div>
        </aside>
      </div>
    </div>
  );
}
