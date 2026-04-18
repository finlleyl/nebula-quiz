import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/features/auth/RequireAuth";
import { SilentRefresh } from "@/features/auth/SilentRefresh";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LandingPage from "@/pages/landing/LandingPage";
import RegisterPage from "@/pages/register/RegisterPage";

export default function App() {
  return (
    <BrowserRouter>
      <SilentRefresh />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
