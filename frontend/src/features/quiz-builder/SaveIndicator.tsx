import { Check, CircleAlert, Loader2 } from "lucide-react";

import type { SaveStatus } from "./useDebouncedSave";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
        <Loader2 className="size-4 animate-spin" />
        Сохраняем…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-success">
        <Check className="size-4" />
        Сохранено
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-danger">
      <CircleAlert className="size-4" />
      Не сохранилось
    </span>
  );
}
