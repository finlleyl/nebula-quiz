import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { TopNav } from "@/shared/layout/TopNav";
import { Button } from "@/shared/ui/button";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [loggingOut, setLoggingOut] = useState(false);

  const greetingName =
    user && "display_name" in user ? user.display_name : "organizer";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // logout is idempotent server-side; swallow errors
    }
    clearSession();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav />
      <main className="mx-auto max-w-[1280px] px-4 py-24">
        <h1 className="font-display text-[56px] font-bold leading-tight text-text-primary">
          Welcome back, {greetingName}.
        </h1>
        <p className="mt-3 max-w-xl text-text-secondary">
          Your dashboard is under construction. In the next iteration you'll
          see your quizzes, KPI cards, and live sessions here.
        </p>
        <Button
          variant="outline"
          size="md"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-10"
        >
          {loggingOut ? "Signing out…" : "Log out"}
        </Button>
      </main>
    </div>
  );
}
