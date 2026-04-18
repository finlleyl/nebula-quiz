import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "./store";

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return <AuthSplash />;
  }
  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <>{children}</>;
}

function AuthSplash() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg-primary text-text-secondary">
      <span className="font-display">Loading…</span>
    </div>
  );
}
