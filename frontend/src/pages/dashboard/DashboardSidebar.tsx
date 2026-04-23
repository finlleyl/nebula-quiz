import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Radio,
  Settings as SettingsIcon,
} from "lucide-react";

import { authApi } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { useCreateQuiz } from "@/features/quizzes/hooks";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";
import { cn } from "@/shared/lib/utils";

const items = [
  { to: "/dashboard", label: "Обзор", Icon: LayoutDashboard },
  { to: "/quizzes", label: "Мои квизы", Icon: FolderKanban },
  { to: "/sessions", label: "Идут сейчас", Icon: Radio, badge: 0 },
  { to: "/analytics", label: "Аналитика", Icon: BarChart3 },
  { to: "/settings", label: "Настройки", Icon: SettingsIcon, disabled: true },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const createQuiz = useCreateQuiz();

  const displayName =
    user && "display_name" in user && user.display_name
      ? user.display_name
      : "Организатор";
  const plan =
    user && "plan" in user && user.plan === "pro"
      ? "Pro · Ведущий"
      : "Бесплатный";

  const handleCreate = async () => {
    const quiz = await createQuiz.mutateAsync({ title: "Новый квиз" });
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
    <aside className="sticky top-0 flex h-screen w-[248px] flex-col gap-1 border-r border-divider bg-bg-sidebar p-4">
      <div className="px-2 pb-4 pt-2">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, Icon, disabled, badge }) =>
          disabled ? (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-semibold text-text-tertiary"
              title="Скоро"
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
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-accent-softer text-accent"
                    : "text-text-primary hover:bg-bg-muted",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "size-5",
                      isActive ? "text-accent" : "text-text-secondary",
                    )}
                  />
                  <span>{label}</span>
                  {badge ? (
                    <span className="ml-auto rounded-pill bg-accent px-[7px] py-[2px] text-[11px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ),
        )}
      </nav>

      <div className="flex-1" />

      <Button
        onClick={handleCreate}
        disabled={createQuiz.isPending}
        className="h-11 w-full gap-2"
      >
        <Plus className="size-[18px]" />
        {createQuiz.isPending ? "Создаём…" : "Новый квиз"}
      </Button>

      <div className="mt-3 flex items-center gap-[10px] rounded-[12px] bg-bg-muted p-[10px]">
        <Avatar name={displayName} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {displayName}
          </p>
          <p className="text-xs text-text-secondary">{plan}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Выйти"
          className="btn-icon ml-auto size-8"
          title="Выйти"
        >
          <LogOut className="size-[18px]" />
        </button>
        <span className="sr-only">
          <MoreHorizontal />
        </span>
      </div>
    </aside>
  );
}
