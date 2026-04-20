import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuthStore } from "./store";
import type { UserRole } from "./types";

interface Props {
  roles: UserRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
