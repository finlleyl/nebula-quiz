import { Link } from "react-router-dom";

import { RegisterForm } from "@/features/auth/RegisterForm";
import { Logo } from "@/shared/ui/Logo";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex h-16 items-center border-b border-divider bg-bg-surface px-8">
        <Link to="/">
          <Logo />
        </Link>
      </header>

      <main className="grid flex-1 place-items-center px-4 py-10">
        <div className="card w-full max-w-md p-8 shadow-elev">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
              Регистрация
            </div>
            <h1 className="mt-1.5 font-display text-[28px] font-extrabold tracking-[-0.02em]">
              Создайте аккаунт
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Проводите квизы для класса, команды или мероприятия.
            </p>
          </div>

          <div className="mt-6">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-[13px] text-text-secondary">
            Уже есть аккаунт?{" "}
            <Link to="/" className="font-semibold text-accent hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
