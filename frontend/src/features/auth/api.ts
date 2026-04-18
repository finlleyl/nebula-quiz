import { api } from "@/shared/lib/http";

import type { LoginInput, RegisterApiInput } from "./schemas";
import type { RefreshResponse, SessionResponse } from "./types";

export const authApi = {
  register: (input: RegisterApiInput) =>
    api.post("auth/register", { json: input }).json<SessionResponse>(),

  login: (input: LoginInput) =>
    api.post("auth/login", { json: input }).json<SessionResponse>(),

  refresh: () =>
    api.post("auth/refresh").json<RefreshResponse>(),

  logout: async () => {
    await api.post("auth/logout");
  },
};
