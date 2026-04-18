import { Bell, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Logo } from "@/shared/ui/Logo";

const navLinks: Array<{ label: string; href: string }> = [
  { label: "Explore", href: "#" },
  { label: "Library", href: "#" },
  { label: "Reports", href: "#" },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-[rgba(12,12,31,0.8)] shadow-[0px_20px_40px_0px_rgba(166,139,255,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1536px] items-center justify-between px-6 py-4">
        <Link to="/" aria-label="Nebula Quiz home">
          <Logo />
        </Link>
        <nav className="hidden gap-8 text-[16px] font-medium text-text-secondary md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-text-secondary">
          <button
            type="button"
            aria-label="Notifications"
            className="grid place-items-center rounded-pill p-2 transition-colors hover:bg-bg-card hover:text-text-primary"
          >
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Profile"
            className="grid place-items-center rounded-pill p-2 transition-colors hover:bg-bg-card hover:text-text-primary"
          >
            <UserCircle2 className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
