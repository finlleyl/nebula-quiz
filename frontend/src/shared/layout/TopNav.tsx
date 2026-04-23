import { Bell, Search } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store";
import { Avatar } from "@/shared/ui/Avatar";
import { Logo } from "@/shared/ui/Logo";
import { cn } from "@/shared/lib/utils";

const navLinks = [
  { label: "Главная", to: "/" },
  { label: "Каталог", to: "/explore" },
  { label: "Мои игры", to: "/library" },
  { label: "История", to: "/reports" },
] as const;

export function TopNav() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName =
    user && "display_name" in user && user.display_name
      ? user.display_name
      : "Гость";

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-divider bg-bg-surface">
      <div className="flex h-full items-center gap-6 px-6">
        <Link to="/" aria-label="Квиз.Лайв">
          <Logo />
        </Link>
        <nav className="ml-4 flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-sm px-[14px] py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-accent-softer text-accent"
                    : "text-text-secondary hover:text-text-primary",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="relative w-[320px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-text-tertiary"
          />
          <input
            className="input h-10 pl-10"
            placeholder="Поиск квизов, авторов…"
          />
        </div>
        <button
          type="button"
          aria-label="Уведомления"
          className="btn-icon"
        >
          <Bell className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Профиль"
          onClick={() => navigate(user ? "/dashboard" : "/")}
          className="rounded-pill"
        >
          <Avatar name={displayName} size={32} />
        </button>
      </div>
    </header>
  );
}
