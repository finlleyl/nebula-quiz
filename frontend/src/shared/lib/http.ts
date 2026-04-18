import ky, { HTTPError } from "ky";

import { useAuthStore } from "@/features/auth/store";

const rawPrefix = import.meta.env.VITE_API_BASE ?? "/api/v1";
const prefix = rawPrefix.endsWith("/") ? rawPrefix : `${rawPrefix}/`;

export const api = ky.create({
  prefix,
  credentials: "include",
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = useAuthStore.getState().accessToken;
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
  },
});

export { HTTPError };

export interface ProblemJson {
  type?: string;
  title: string;
  status: number;
  detail?: string;
}

export async function readProblem(err: unknown): Promise<ProblemJson | null> {
  if (!(err instanceof HTTPError)) return null;
  try {
    return (await err.response.json()) as ProblemJson;
  } catch {
    return null;
  }
}
