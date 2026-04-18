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
      setServerError(problem?.detail ?? problem?.title ?? "Registration failed");
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <AuthInput
        placeholder="Display name"
        autoComplete="name"
        {...register("display_name")}
        error={errors.display_name?.message}
      />
      <AuthInput
        placeholder="Email Address"
        type="email"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <AuthInput
        placeholder="Password (min. 8 characters)"
        type="password"
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />

      {serverError ? (
        <p role="alert" className="text-center text-sm text-accent-error">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-auto w-full py-[14px] font-display text-[18px] font-bold"
      >
        {isSubmitting ? "Creating account…" : "Create Organizer Account"}
      </Button>
    </form>
  );
}
