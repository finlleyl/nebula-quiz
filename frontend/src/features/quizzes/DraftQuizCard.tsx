import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCreateQuiz } from "./hooks";

export function DraftQuizCard() {
  const navigate = useNavigate();
  const createQuiz = useCreateQuiz();

  const handle = async () => {
    const quiz = await createQuiz.mutateAsync({ title: "Новый квиз" });
    navigate(`/quizzes/${quiz.id}/edit`);
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={createQuiz.isPending}
      className="card flex w-[280px] min-h-[200px] shrink-0 cursor-pointer flex-col items-center justify-center gap-[10px] !border-2 !border-dashed !border-border-strong !bg-transparent !shadow-none text-text-secondary disabled:cursor-wait disabled:opacity-60"
    >
      <div className="grid size-12 place-items-center rounded-md bg-accent-soft text-accent">
        <Plus className="size-6" />
      </div>
      <span className="text-sm font-semibold text-text-primary">
        {createQuiz.isPending ? "Создаём…" : "Создать новый квиз"}
      </span>
      <span className="text-xs">или импортировать из Google Forms</span>
    </button>
  );
}
