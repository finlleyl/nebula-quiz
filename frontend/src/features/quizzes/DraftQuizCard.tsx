import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCreateQuiz } from "./hooks";

export function DraftQuizCard() {
  const navigate = useNavigate();
  const createQuiz = useCreateQuiz();

  const handle = async () => {
    const quiz = await createQuiz.mutateAsync({ title: "Untitled quiz" });
    navigate(`/quizzes/${quiz.id}/edit`);
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={createQuiz.isPending}
      className="group flex w-[280px] shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border px-6 py-12 text-text-secondary transition-colors hover:border-primary-500 hover:text-primary-400 disabled:cursor-wait disabled:opacity-60"
    >
      <div className="grid size-12 place-items-center rounded-full bg-primary-500/10 text-primary-400 transition-colors group-hover:bg-primary-500/20">
        <Plus className="size-6" />
      </div>
      <span className="font-display text-lg font-semibold">
        {createQuiz.isPending ? "Creating…" : "Draft New Quiz"}
      </span>
    </button>
  );
}
