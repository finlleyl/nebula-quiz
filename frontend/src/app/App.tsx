import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireRole } from "@/features/auth/RequireRole";
import { SilentRefresh } from "@/features/auth/SilentRefresh";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import HostLobbyPage from "@/pages/host/HostLobbyPage";
import LandingPage from "@/pages/landing/LandingPage";
import PlayerJoinPage from "@/pages/play/PlayerJoinPage";
import PlayerLobbyPage from "@/pages/play/PlayerLobbyPage";
import MyQuizzesPage from "@/pages/quizzes/MyQuizzesPage";
import QuizBuilderPage from "@/pages/quiz-builder/QuizBuilderPage";
import QuizPreviewPage from "@/pages/quiz-preview/QuizPreviewPage";
import RegisterPage from "@/pages/register/RegisterPage";

import { QueryProvider } from "./providers/QueryProvider";

const organizerRoles = ["organizer", "admin"] as const;

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <SilentRefresh />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Player join flow — no auth required */}
          <Route path="/join" element={<PlayerJoinPage />} />
          <Route path="/join/:code" element={<PlayerJoinPage />} />
          <Route path="/play/:code/lobby" element={<PlayerLobbyPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <RequireRole roles={[...organizerRoles]}>
                  <DashboardPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/quizzes"
            element={
              <RequireAuth>
                <RequireRole roles={[...organizerRoles]}>
                  <MyQuizzesPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/quizzes/:id"
            element={
              <RequireAuth>
                <QuizPreviewPage />
              </RequireAuth>
            }
          />
          <Route
            path="/quizzes/:id/edit"
            element={
              <RequireAuth>
                <RequireRole roles={[...organizerRoles]}>
                  <QuizBuilderPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Host live session — requires organizer */}
          <Route
            path="/host/:code"
            element={
              <RequireAuth>
                <RequireRole roles={[...organizerRoles]}>
                  <HostLobbyPage />
                </RequireRole>
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}
