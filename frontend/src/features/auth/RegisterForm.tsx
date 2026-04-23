import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { readProblem } from "@/shared/lib/http";

import { authApi } from "./api";
import { AuthInput } from "./AuthInput";
import { RegisterSchema, type RegisterFormInput } from "./schemas";
import { useAuthStore } from "./store";

export function RegisterForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await authApi.register({ ...values, role: "organizer" });
      setSession(res.user, res.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const problem = await readProblem(err);
      setServerError(
        problem?.detail ?? problem?.title ?? "Не удалось зарегистрироваться",
      );
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="field">
        <label className="field-label">Имя</label>
        <AuthInput
          placeholder="Как к вам обращаться"
          autoComplete="name"
          {...register("display_name")}
          error={errors.display_name?.message}
        />
      </div>
      <div className="field">
        <label className="field-label">Электронная почта</label>
        <AuthInput
          placeholder="you@school.ru"
          type="email"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />
      </div>
      <div className="field">
        <label className="field-label">Пароль</label>
        <AuthInput
          placeholder="Минимум 8 символов"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          error={errors.password?.message}
        />
      </div>

      {serverError ? (
        <p role="alert" className="text-center text-sm text-danger">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="mt-2 w-full shadow-accent"
      >
        {isSubmitting ? "Создаём аккаунт…" : "Создать аккаунт"}
      </Button>
    </form>
  );
}
