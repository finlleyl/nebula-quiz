import { ArrowLeft, ArrowRight, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useLiveGame } from "@/features/live-game/store";
import type { GameFinishedPayload } from "@/shared/lib/ws/protocol";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";

export default function PlayerResultsPage() {
  const navigate = useNavigate();
  const { finishedPayload, myRank, myScore, disconnect } = useLiveGame();

  function handleExit() {
    disconnect();
    navigate("/", { replace: true });
  }

  const payload: GameFinishedPayload | null = finishedPayload;
  const allEntries = payload ? [...payload.podium, ...payload.runner_ups] : [];
  const first = payload?.podium.find((p) => p.rank === 1);
  const second = payload?.podium.find((p) => p.rank === 2);
  const third = payload?.podium.find((p) => p.rank === 3);
  const runnerUps = allEntries.filter((p) => p.rank > 3);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-bg-page">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-48 -top-48 size-[640px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,119,255,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-36 -right-36 size-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,185,34,0.15), transparent 70%)",
        }}
      />

      <header className="relative z-10 flex h-16 items-center gap-4 border-b border-divider bg-bg-surface/80 px-8 backdrop-blur">
        <Logo />
        <div className="flex-1" />
        <button type="button" className="btn-icon" aria-label="Уведомления">
          <Bell className="size-5" />
        </button>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1100px] flex-1 px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10 text-center"
        >
          <span className="chip chip-success mb-3.5">
            <span className="dot" /> Матч завершён
          </span>
          <h1 className="font-display text-[56px] font-extrabold leading-[1.05] tracking-[-0.03em]">
            Игра завершена
          </h1>
          {payload ? (
            <p className="mt-2.5 text-base text-text-secondary">
              Матч №{payload.match_number}
            </p>
          ) : null}
        </motion.div>

        {payload && (first || second || third) ? (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.15, delayChildren: 0.3 },
              },
            }}
            className="mx-auto mb-12 flex max-w-[780px] items-end gap-4"
          >
            <PodiumColumn place={2} entry={second} isSelf={myRank === 2} />
            <PodiumColumn place={1} entry={first} isSelf={myRank === 1} big />
            <PodiumColumn place={3} entry={third} isSelf={myRank === 3} />
          </motion.div>
        ) : null}

        {runnerUps.length > 0 ? (
          <div className="card mx-auto max-w-[720px] p-5">
            <h3 className="mb-3.5 font-display text-lg font-bold">
              Остальные игроки
            </h3>
            <div className="flex flex-col gap-1.5">
              {runnerUps.map((p) => (
                <RunnerRow
                  key={`${p.rank}-${p.nickname}`}
                  rank={p.rank}
                  nickname={p.nickname}
                  score={p.score}
                  isSelf={myRank === p.rank}
                />
              ))}
            </div>
          </div>
        ) : null}

        {payload && myRank > 0 && !allEntries.some((p) => p.rank === myRank) ? (
          <div className="mx-auto mt-6 max-w-[720px]">
            <RunnerRow rank={myRank} nickname="Вы" score={myScore} isSelf />
          </div>
        ) : null}

        <div className="mx-auto mt-9 flex max-w-[500px] gap-3">
          <Button
            variant="secondary"
            size="xl"
            className="flex-1"
            onClick={handleExit}
          >
            <ArrowLeft className="size-[18px]" /> Выйти
          </Button>
          <Button
            size="xl"
            className="flex-[2] shadow-accent"
            onClick={handleExit}
          >
            Сыграть ещё раз <ArrowRight className="size-[18px]" />
          </Button>
        </div>
      </main>
    </div>
  );
}

type Entry = { rank: number; nickname: string; score: number } | undefined;

function PodiumColumn({
  place,
  entry,
  isSelf,
  big = false,
}: {
  place: 1 | 2 | 3;
  entry: Entry;
  isSelf: boolean;
  big?: boolean;
}) {
  if (!entry) return <div className="flex-1" />;
  const h = place === 1 ? 220 : place === 2 ? 160 : 130;
  const bg =
    place === 1
      ? "linear-gradient(180deg, #0077FF, #004DA8)"
      : "var(--bg-surface)";
  const fontColor = place === 1 ? "#fff" : "var(--text-primary)";
  const medal =
    place === 1 ? "var(--gold)" : place === 2 ? "var(--silver)" : "var(--bronze)";

  return (
    <div className="flex flex-1 flex-col items-center gap-3.5">
      <div className="relative">
        <Avatar
          name={entry.nickname}
          size={big ? 96 : 64}
          ring={place === 1}
        />
        <div
          className="absolute -bottom-2 left-1/2 grid size-8 -translate-x-1/2 place-items-center rounded-full border-[3px] border-white font-display text-sm font-extrabold text-white"
          style={{ background: medal }}
        >
          {place}
        </div>
      </div>
      <div className="text-center">
        <div className="text-base font-bold">
          {entry.nickname}
          {isSelf ? " (Вы)" : ""}
        </div>
        <div className="font-mono text-sm font-bold text-text-secondary">
          {entry.score.toLocaleString("ru-RU")}
        </div>
      </div>
      <div
        className="flex w-full items-center justify-center rounded-t-lg font-display font-extrabold tracking-[-0.02em]"
        style={{
          height: h,
          background: bg,
          color: fontColor,
          fontSize: place === 1 ? 64 : 48,
          boxShadow:
            place === 1
              ? "0 20px 40px rgba(0,119,255,0.3)"
              : "var(--shadow-card)",
          border: place !== 1 ? "1px solid var(--border)" : "none",
          borderBottom: "none",
        }}
      >
        {place}
      </div>
    </div>
  );
}

function RunnerRow({
  rank,
  nickname,
  score,
  isSelf,
}: {
  rank: number;
  nickname: string;
  score: number;
  isSelf: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-md p-3.5 ${isSelf ? "bg-accent-softer ring-1 ring-accent/25" : "bg-bg-muted"}`}
    >
      <div
        className={`w-8 text-center font-display text-base font-extrabold ${isSelf ? "text-accent" : "text-text-secondary"}`}
      >
        {rank}
      </div>
      {isSelf ? (
        <div className="grid size-10 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-white">
          ВЫ
        </div>
      ) : (
        <Avatar name={nickname} size={40} />
      )}
      <span
        className={`flex-1 text-[15px] ${isSelf ? "font-bold" : "font-semibold"}`}
      >
        {nickname}
      </span>
      <span
        className={`font-mono text-lg font-bold ${isSelf ? "text-accent" : ""}`}
      >
        {score.toLocaleString("ru-RU")}
      </span>
    </div>
  );
}
