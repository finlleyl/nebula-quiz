import { Rocket } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { LoginForm } from "@/features/auth/LoginForm";
import { TopNav } from "@/shared/layout/TopNav";
import { Button } from "@/shared/ui/button";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-clip bg-bg-primary">
      <AmbientGradients />
      <TopNav />

      <main className="relative mx-auto max-w-[1280px] px-4 pb-[128px] pt-[96px] md:pb-[208px] md:pt-[160px]">
        <div className="grid grid-cols-1 items-center gap-x-24 gap-y-16 md:grid-cols-2">
          <HeroSide />
          <AuthCard />
        </div>
      </main>
    </div>
  );
}

function AmbientGradients() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[640px] w-[640px] -translate-y-1/4 translate-x-1/4 rounded-full bg-[rgba(166,139,255,0.15)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-[512px] w-[512px] -translate-x-1/4 translate-y-1/4 rounded-full bg-[rgba(124,77,255,0.1)] blur-3xl"
      />
    </>
  );
}

function HeroSide() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <h1 className="font-display text-[56px] font-bold leading-[1] tracking-[-1.8px] text-text-primary md:text-[72px] md:leading-[72px]">
          Enter The
          <br />
          <span className="bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
            Nebula.
          </span>
        </h1>
        <p className="max-w-md text-[18px] leading-[28px] text-text-secondary md:text-[20px]">
          Join live games instantly. No account required to play. Just enter
          the code from your Game Master.
        </p>
      </div>

      <JoinGameCard onSubmit={(code) => navigate(`/join/${code}`)} />
    </div>
  );
}

interface JoinGameCardProps {
  onSubmit: (code: string) => void;
}

function JoinGameCard({ onSubmit }: JoinGameCardProps) {
  const [code, setCode] = useState("");
  const isValid = code.trim().length > 0;

  return (
    <div className="relative overflow-clip rounded-[48px] px-8 pb-12 pt-8 shadow-[0_20px_40px_0_rgba(166,139,255,0.08)] backdrop-blur-md">
      <Rocket className="absolute right-4 top-4 size-[56px] -rotate-12 text-primary-400/60" />

      <h2 className="font-display text-[24px] font-bold leading-8 text-text-primary">
        Join a Game
      </h2>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) onSubmit(code.trim());
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ROOM CODE"
          maxLength={8}
          spellCheck={false}
          className="w-full rounded-[32px] bg-[#161632] px-6 py-4 text-center font-display text-[24px] uppercase tracking-[0.1em] text-text-primary placeholder:text-text-secondary/50 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        />
        <Button
          type="submit"
          size="lg"
          disabled={!isValid}
          className="h-auto w-full py-4 font-display text-[20px] font-bold"
        >
          Enter Room
        </Button>
      </form>
    </div>
  );
}

function AuthCard() {
  return (
    <div className="relative rounded-[48px] border border-[rgba(68,68,108,0.15)] bg-bg-card p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-[rgba(166,140,255,0.1)] blur-xl"
      />

      <div className="space-y-2 text-center">
        <h2 className="font-display text-[30px] font-bold leading-9 text-text-primary">
          Game Masters
        </h2>
        <p className="text-[16px] leading-6 text-text-secondary">
          Create, host, and analyze.
        </p>
      </div>

      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
