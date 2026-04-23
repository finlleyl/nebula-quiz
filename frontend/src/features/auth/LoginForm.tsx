import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Globe, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { readProblem } from "@/shared/lib/http";

import { authApi } from "./api";
import { LoginSchema, type LoginInput } from "./schemas";
import { useAuthStore } from "./store";

interface LocationState {
  from?: string;
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await authApi.login(values);
      setSession(res.user, res.access_token);
      const from =
        (location.state as LocationState | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const problem = await readProblem(err);
      setServerError(problem?.detail ?? problem?.title ?? "Не удалось войти");
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[14px]">
      <div className="field">
        <label className="field-label">Электронная почта</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-[14px] top-1/2 size-[18px] -translate-y-1/2 text-text-tertiary" />
          <input
            type="email"
            autoComplete="email"
            placeholder="you@school.ru"
            className="input pl-[42px]"
            {...register("email")}
          />
        </div>
        {errors.email?.message ? (
          <p role="alert" className="text-xs text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="field">
        <div className="flex items-center justify-between">
          <label className="field-label">Пароль</label>
          <button
            type="button"
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Забыли?
          </button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-[14px] top-1/2 size-[18px] -translate-y-1/2 text-text-tertiary" />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="input pl-[42px]"
            {...register("password")}
          />
        </div>
        {errors.password?.message ? (
          <p role="alert" className="text-xs text-danger">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-secondary">
        <button
          type="button"
          onClick={() => setRemember((v) => !v)}
          className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] ${remember ? "bg-accent" : "bg-bg-muted"}`}
          aria-pressed={remember}
          aria-label="Запомнить меня"
        >
          {remember ? (
            <Check className="size-3 text-white" strokeWidth={3} />
          ) : null}
        </button>
        Запомнить меня на этом устройстве
      </label>

      {serverError ? (
        <p role="alert" className="text-center text-sm text-danger">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="mt-1 w-full shadow-accent"
      >
        {isSubmitting ? "Входим…" : "Войти в кабинет"}
      </Button>

      <div className="relative my-2">
        <hr className="divider" />
        <span className="absolute left-1/2 top-[-8px] -translate-x-1/2 bg-bg-surface px-[10px] text-xs text-text-tertiary">
          или
        </span>
      </div>

      <Button type="button" variant="secondary" className="w-full">
        <Globe className="size-[18px]" /> Войти через Яндекс ID
      </Button>

      <p className="pt-[14px] text-center text-[13px] text-text-secondary">
        Ещё нет аккаунта?{" "}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
