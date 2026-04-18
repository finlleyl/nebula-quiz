import { create } from "zustand";

import type { PartialUser, User } from "./types";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface AuthState {
  user: User | PartialUser | null;
  accessToken: string | null;
  status: AuthStatus;

  setLoading: () => void;
  setUnauthenticated: () => void;
  setSession: (user: User, token: string) => void;
  setPartialSession: (user: PartialUser, token: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setLoading: () => set({ status: "loading" }),
  setUnauthenticated: () =>
    set({ status: "unauthenticated", user: null, accessToken: null }),
  setSession: (user, token) =>
    set({ user, accessToken: token, status: "authenticated" }),
  setPartialSession: (user, token) =>
    set({ user, accessToken: token, status: "authenticated" }),
  clearSession: () =>
    set({ user: null, accessToken: null, status: "unauthenticated" }),
}));
