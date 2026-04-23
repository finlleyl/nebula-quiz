import { ArrowRight, Bolt, Check, Eye, Timer, Users, X, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useLiveGame } from "@/features/live-game/store";
import { useServerTimer } from "@/features/live-game/hooks";
import type { QuestionStartPayload, QuestionStats } from "@/shared/lib/ws/protocol";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";

const LETTERS = ["A", "Б", "В", "Г"];
const COLORS = ["#0077FF", "#4BB34B", "#FF9900", "#E64646"];

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
      <div className="grid min-h-screen place-items-center bg-bg-page text-text-secondary">
        <p className="animate-pulse">Ожидаем вопрос…</p>
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
      roomCode={code ?? ""}
      quizTitle={roomState?.quiz?.title ?? ""}
      leaderboard={leaderboard}
      onNext={nextQuestion}
      onSkip={skipQuestion}
    />
  );
}

interface HostQuestionViewProps {
  question: QuestionStartPayload;
  totalParticipants: number;
  isRevealing: boolean;
  correctIds: string[];
  stats: QuestionStats | undefined;
  roomCode: string;
  quizTitle: string;
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
  roomCode,
  quizTitle,
  leaderboard,
  onNext,
  onSkip,
}: HostQuestionViewProps) {
  const { remainingMs } = useServerTimer(
    question.server_ts,
    question.time_limit_ms,
  );

  const remainingSec = Math.ceil(remainingMs / 1000);
  const answeredCount = stats?.answered ?? 0;
  const totalAnswered = stats
    ? Object.values(stats.distribution).reduce((s, c) => s + c, 0) ||
      answeredCount ||
      1
    : 1;

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex h-16 items-center gap-4 border-b border-divider bg-bg-surface px-8">
        <Logo />
        <div className="ml-5 flex items-center gap-2.5">
          <span className="chip chip-danger">
            <span className="dot" /> В ЭФИРЕ
          </span>
          <span className="font-mono text-[13px] text-text-secondary">
            {roomCode}
          </span>
          {quizTitle ? (
            <span className="text-[13px] text-text-secondary">· {quizTitle}</span>
          ) : null}
        </div>
        <div className="flex-1" />
        <Button variant="secondary">
          <Eye className="size-4" /> Режим игрока
        </Button>
        <Button variant="secondary">
          <X className="size-4" /> Завершить
        </Button>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
        <main className="flex flex-col gap-6 overflow-auto px-12 py-8">
          <div className="flex items-center gap-4">
            <span className="chip chip-accent px-3.5 py-1.5 text-sm">
              Вопрос {question.index + 1} из {question.total}
            </span>
            <div className="card flex items-center gap-2.5 px-4 py-2">
              <Timer className="size-5 text-accent" />
              <span className="font-mono text-2xl font-extrabold text-accent">
                {Math.max(0, remainingSec)}
              </span>
              <span className="text-[13px] text-text-secondary">сек.</span>
            </div>
            <div className="card flex items-center gap-2.5 px-4 py-2">
              <Users className="size-[18px]" />
              <span className="text-base font-bold">
                {answeredCount}/{totalParticipants} ответили
              </span>
            </div>
            <div className="flex-1" />
            {!isRevealing ? (
              <Button variant="secondary" onClick={onSkip}>
                Пропустить
              </Button>
            ) : null}
            {isRevealing ? (
              <Button className="shadow-accent" onClick={onNext}>
                {question.index + 1 >= question.total
                  ? "Завершить игру"
                  : "Следующий вопрос"}{" "}
                <ArrowRight className="size-4" />
              </Button>
            ) : null}
          </div>

          <div className="card p-10 text-center">
            <h1 className="font-display text-[44px] font-extrabold leading-[1.2] tracking-[-0.02em]">
              {question.text}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {question.options.map((opt, i) => {
              const count = stats?.distribution[opt.id] ?? 0;
              const pct = Math.round((count / totalAnswered) * 100);
              const color = COLORS[i % COLORS.length];
              const letter = LETTERS[i] ?? opt.label;
              const isCorrect = correctIds.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  className="card relative overflow-hidden p-[18px]"
                >
                  <div
                    className="absolute inset-y-0 left-0 opacity-[0.08]"
                    style={{ background: color, width: `${pct}%` }}
                  />
                  <div className="relative flex items-center gap-3.5">
                    <div
                      className="grid size-10 place-items-center rounded-md font-display text-lg font-extrabold text-white"
                      style={{ background: color }}
                    >
                      {letter}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[15px] font-semibold">
                        {opt.text}
                        {isRevealing && isCorrect ? (
                          <Check
                            className="size-4 text-success"
                            strokeWidth={3}
                          />
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-xs text-text-secondary">
                        {count} ответов · {pct}%
                      </div>
                    </div>
                    <div
                      className="font-mono text-[26px] font-extrabold"
                      style={{ color }}
                    >
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <aside className="flex flex-col gap-3 overflow-auto border-l border-divider bg-bg-surface p-5">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
            Живая лента
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-xs text-text-tertiary">
              Ответов пока нет
            </p>
          ) : null}
          {leaderboard.slice(0, 8).map((entry, i) => (
            <div
              key={entry.participant_id}
              className={`flex items-center gap-2.5 rounded-[10px] p-2 ${i === 0 ? "bg-success-soft" : ""}`}
            >
              <Avatar name={entry.nickname} size={32} />
              <div className="flex-1">
                <b className="text-[13px]">{entry.nickname}</b>
                <div className="text-xs text-text-secondary">
                  счёт: {entry.score.toLocaleString("ru-RU")}
                </div>
              </div>
              {i === 0 ? (
                <Zap className="size-4 fill-warning text-warning" />
              ) : null}
              {i === 3 ? (
                <Bolt className="size-4 text-warning" />
              ) : null}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
