import { Link } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store";
import { DraftQuizCard } from "@/features/quizzes/DraftQuizCard";
import { QuizCard } from "@/features/quizzes/QuizCard";
import { useMyQuizzes } from "@/features/quizzes/hooks";

import { DashboardSidebar } from "./DashboardSidebar";
import { KPICard } from "./KPICard";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const displayName =
    user && "display_name" in user && user.display_name
      ? user.display_name
      : "organizer";

  const { data, isLoading, error } = useMyQuizzes(12, 0);
  const quizzes = data?.items ?? [];
  const totalPlays = quizzes.reduce((acc, q) => acc + (q.plays_count ?? 0), 0);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <DashboardSidebar />

      <main className="flex-1 px-10 py-10">
        <header className="mb-10">
          <h1 className="font-display text-[40px] font-bold leading-tight text-text-primary">
            Welcome back, {displayName}.
          </h1>
          <p className="mt-2 text-text-secondary">
            Your quizzes are reaching new galaxies today.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KPICard
            label="Total Players"
            value={formatBigNumber(totalPlays)}
            valueClassName="text-accent-cyan"
            hint={<span className="text-accent-amber">+14% this week</span>}
          />
          <KPICard
            label="Active Sessions"
            value="0"
            hint={
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent-success" />
                Currently live
              </span>
            }
          />
          <KPICard
            label="Avg Completion Rate"
            value="78%"
            progress={78}
          />
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              My Quizzes
            </h2>
            <Link
              to="/quizzes"
              className="text-sm font-semibold uppercase tracking-wider text-primary-400 hover:text-primary-500"
            >
              View all →
            </Link>
          </div>

          {isLoading ? (
            <p className="text-text-secondary">Loading quizzes…</p>
          ) : error ? (
            <p className="text-accent-error">Failed to load quizzes.</p>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4">
              {quizzes.map((q) => (
                <QuizCard key={q.id} quiz={q} />
              ))}
              <DraftQuizCard />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function formatBigNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
