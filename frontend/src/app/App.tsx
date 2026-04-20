import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireRole } from "@/features/auth/RequireRole";
import { SilentRefresh } from "@/features/auth/SilentRefresh";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LandingPage from "@/pages/landing/LandingPage";
import MyQuizzesPage from "@/pages/quizzes/MyQuizzesPage";
import QuizBuilderPage from "@/pages/quiz-builder/QuizBuilderPage";
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
            path="/quizzes/:id/edit"
            element={
              <RequireAuth>
                <RequireRole roles={[...organizerRoles]}>
                  <QuizBuilderPage />
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
