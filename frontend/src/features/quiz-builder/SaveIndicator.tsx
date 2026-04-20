import { Check, CircleAlert, Loader2 } from "lucide-react";

import type { SaveStatus } from "./useDebouncedSave";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-accent-success">
        <Check className="size-4" />
        Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm text-accent-error">
      <CircleAlert className="size-4" />
      Save failed
    </span>
  );
}
