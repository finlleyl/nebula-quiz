import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { readProblem } from "@/shared/lib/http";

import { authApi } from "./api";
import { AuthInput } from "./AuthInput";
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
      const from = (location.state as LocationState | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const problem = await readProblem(err);
      setServerError(problem?.detail ?? problem?.title ?? "Login failed");
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <AuthInput
        placeholder="Email Address"
        type="email"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <AuthInput
        placeholder="Password"
        type="password"
        autoComplete="current-password"
        {...register("password")}
        error={errors.password?.message}
      />

      <div className="flex items-center justify-between pt-2 text-[14px]">
        <label className="flex cursor-pointer items-center gap-2 text-text-secondary">
          <input
            type="checkbox"
            className="size-4 rounded-md border border-border bg-[#161632] accent-primary-500"
          />
          <span>Remember me</span>
        </label>
        <button
          type="button"
          className="text-accent-cyan transition-colors hover:underline"
        >
          Forgot password?
        </button>
      </div>

      {serverError ? (
        <p role="alert" className="text-center text-sm text-accent-error">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="outline"
        size="lg"
        disabled={isSubmitting}
        className="h-auto w-full border-2 border-[rgba(68,68,108,0.15)] py-[14px] font-display text-[18px] font-bold text-primary-400"
      >
        {isSubmitting ? "Signing in…" : "Login"}
      </Button>

      <p className="pt-2 text-center text-[14px] text-text-secondary">
        New organizer?{" "}
        <Link
          to="/register"
          className="font-bold text-accent-amber hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </form>
  );
}
