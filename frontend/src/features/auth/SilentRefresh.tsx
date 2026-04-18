import { useEffect } from "react";

import { authApi } from "./api";
import { decodeAccessToken } from "./jwt";
import { useAuthStore } from "./store";

// Module-scoped guard — React 18 StrictMode double-invokes effects in dev,
// which would otherwise fire two /auth/refresh calls and trip the backend's
// refresh-reuse detection (second call sees the just-rotated token as revoked
// and invalidates ALL of the user's sessions).
let refreshStarted = false;

export function SilentRefresh() {
  const setLoading = useAuthStore((s) => s.setLoading);
  const setPartialSession = useAuthStore((s) => s.setPartialSession);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  useEffect(() => {
    if (refreshStarted) return;
    refreshStarted = true;

    setLoading();
    authApi
      .refresh()
      .then((res) => {
        const partial = decodeAccessToken(res.access_token);
        if (!partial) {
          setUnauthenticated();
          return;
        }
        setPartialSession(partial, res.access_token);
      })
      .catch(() => {
        setUnauthenticated();
      });
  }, [setLoading, setPartialSession, setUnauthenticated]);

  return null;
}
