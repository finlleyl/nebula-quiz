import { ArrowRight, Lock, Rocket } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { LoginForm } from "@/features/auth/LoginForm";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/Logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <PublicHeader />
      <main className="grid flex-1 grid-cols-1 items-stretch gap-12 px-8 py-10 md:grid-cols-2 md:px-20">
        <HeroSide />
        <AuthSide />
      </main>
    </div>
  );
}

function PublicHeader() {
  const navigate = useNavigate();
  return (
    <header className="flex h-16 items-center gap-6 border-b border-divider bg-bg-surface px-8">
      <Link to="/" aria-label="Квиз.Лайв">
        <Logo />
      </Link>
      <div className="flex-1" />
      <nav className="hidden items-center gap-2 md:flex">
        {[
          { label: "Каталог квизов", to: "/explore" },
          { label: "Для школ", to: "/explore" },
          { label: "Помощь", to: "/explore" },
        ].map((l) => (
          <Link
            key={l.label}
            to={l.to}
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <Button variant="secondary" onClick={() => navigate("/register")}>
        Войти
      </Button>
      <Button onClick={() => navigate("/register")}>Создать квиз</Button>
    </header>
  );
}

function HeroSide() {
  const navigate = useNavigate();
  const [code, setCode] = useState("7X9-2B4");
  const normalized = code.trim().toUpperCase();
  const isValid = normalized.length >= 5;

  const handleJoin = () => {
    if (isValid) navigate(`/join/${normalized}`);
  };

  return (
    <div className="mx-auto flex max-w-[520px] flex-col justify-center gap-7">
      <span className="chip chip-accent self-start px-3 py-1.5">
        <span className="dot" /> 12 842 игры сейчас
      </span>
      <h1 className="font-display text-[56px] font-extrabold leading-[1.05] tracking-[-0.03em] text-text-primary">
        Квизы, которые
        <br />
        захватывают
        <br />
        аудиторию.
      </h1>
      <p className="text-[17px] leading-[1.5] text-text-secondary">
        Присоединяйтесь к живой игре за 5 секунд — достаточно только кода.
        Регистрация не нужна, играйте с телефона, планшета или ноутбука.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleJoin();
        }}
        className="card relative overflow-hidden p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-text-primary">
              Войти в игру
            </div>
            <div className="mt-0.5 text-[13px] text-text-secondary">
              Введите код, который показал ведущий
            </div>
          </div>
          <div className="grid size-12 place-items-center rounded-[12px] bg-accent-soft text-accent">
            <Rocket className="size-6" />
          </div>
        </div>

        <div className="flex gap-3">
          <input
            className="input input-lg text-center uppercase"
            placeholder="XXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.1em",
              height: 56,
            }}
          />
          <Button
            type="submit"
            size="lg"
            disabled={!isValid}
            className="h-14 rounded-[12px] px-7 text-base"
          >
            Войти <ArrowRight className="size-[18px]" />
          </Button>
        </div>

        <div className="mt-[14px] flex items-center gap-2 text-[13px] text-text-tertiary">
          <Lock className="size-3.5" />
          Без регистрации. Нужно только указать ник.
        </div>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex">
          {["А", "Б", "В", "Г", "Д"].map((c, i) => (
            <div
              key={c}
              className="rounded-full border-[2px] border-bg-page"
              style={{ marginLeft: i ? -10 : 0 }}
            >
              <Avatar name={c} size={32} color={((i % 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} />
            </div>
          ))}
        </div>
        <div className="text-[13px] text-text-secondary">
          <b className="text-text-primary">+2 140 игроков</b> присоединились
          сегодня
        </div>
      </div>
    </div>
  );
}

function AuthSide() {
  return (
    <div className="flex items-center justify-center">
      <div className="card w-[440px] max-w-full p-8 shadow-elev">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
          Для организаторов
        </div>
        <h2 className="mt-1.5 font-display text-[28px] font-extrabold tracking-[-0.02em] text-text-primary">
          Создавайте и проводите
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Запускайте квизы для класса, команды или мероприятия.
        </p>
        <div className="mt-[22px]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
