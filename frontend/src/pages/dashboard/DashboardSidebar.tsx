import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  Radio,
  Settings as SettingsIcon,
} from "lucide-react";

import { authApi } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { useCreateQuiz } from "@/features/quizzes/hooks";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";
import { cn } from "@/shared/lib/utils";

const items = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/quizzes", label: "My Quizzes", Icon: ListChecks },
  { to: "/sessions", label: "Live Sessions", Icon: Radio, disabled: true },
  { to: "/analytics", label: "Analytics", Icon: BarChart3, disabled: true },
  { to: "/settings", label: "Settings", Icon: SettingsIcon, disabled: true },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const createQuiz = useCreateQuiz();

  const displayName =
    user && "display_name" in user && user.display_name
      ? user.display_name
      : "Organizer";
  const plan =
    user && "plan" in user && user.plan === "pro" ? "Pro Account" : "Free";

  const handleCreate = async () => {
    const quiz = await createQuiz.mutateAsync({ title: "Untitled quiz" });
    navigate(`/quizzes/${quiz.id}/edit`);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* logout idempotent */
    }
    clearSession();
    navigate("/", { replace: true });
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] flex-col gap-6 border-r border-border-subtle bg-bg-secondary/60 px-6 py-8 backdrop-blur-xl">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, Icon, disabled }) =>
          disabled ? (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-text-muted/60"
              title="Coming soon"
            >
              <Icon className="size-5" /> {label}
            </span>
          ) : (
            <NavLink
              key={label}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-base transition-colors",
                  isActive
                    ? "bg-primary-500/15 text-primary-400"
                    : "text-text-secondary hover:bg-bg-card hover:text-text-primary",
                )
              }
            >
              <Icon className="size-5" /> {label}
            </NavLink>
          ),
        )}
      </nav>

      <Button
        onClick={handleCreate}
        disabled={createQuiz.isPending}
        size="md"
        className="gap-2"
      >
        <Plus className="size-4" />
        {createQuiz.isPending ? "Creating…" : "Create New Quiz"}
      </Button>

      <div className="flex items-center gap-3 rounded-[24px] border border-border-subtle bg-bg-card/70 px-4 py-3">
        <div className="grid size-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-white">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {displayName}
          </p>
          <p className="text-xs text-text-muted">{plan}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="rounded-pill p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}
