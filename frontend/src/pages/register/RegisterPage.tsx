import { Link } from "react-router-dom";

import { RegisterForm } from "@/features/auth/RegisterForm";
import { TopNav } from "@/shared/layout/TopNav";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-clip bg-bg-primary">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[640px] w-[640px] -translate-y-1/4 translate-x-1/4 rounded-full bg-[rgba(166,139,255,0.15)] blur-3xl"
      />
      <TopNav />

      <main className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-[1280px] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-[48px] border border-[rgba(68,68,108,0.15)] bg-bg-card p-10">
          <div className="space-y-2 text-center">
            <h1 className="font-display text-[36px] font-bold leading-10 text-text-primary">
              Create account
            </h1>
            <p className="text-text-secondary">
              Host live trivia for your community.
            </p>
          </div>

          <div className="mt-8">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-[14px] text-text-secondary">
            Already have an account?{" "}
            <Link
              to="/"
              className="font-bold text-accent-amber hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
