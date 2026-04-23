import { ArrowLeft, Eye, Pencil, Play, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { QuestionEditor } from "@/features/quiz-builder/QuestionEditor";
import { QuizOverview } from "@/features/quiz-builder/QuizOverview";
import { QuizSettingsPanel } from "./QuizSettingsPanel";
import {
  useCreateQuestion,
  useDeleteQuestion,
  usePublishQuiz,
  useQuiz,
  useReorderQuestions,
  useUpdateQuestion,
  useUpdateQuiz,
} from "@/features/quizzes/hooks";
import type { QuestionType } from "@/features/quizzes/types";
import { Button } from "@/shared/ui/button";

export default function QuizBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = id ?? "";

  const { data, isLoading, error } = useQuiz(quizId);
  const updateQuiz = useUpdateQuiz(quizId);
  const publishQuiz = usePublishQuiz(quizId);
  const createQuestion = useCreateQuestion(quizId);
  const updateQuestion = useUpdateQuestion(quizId);
  const deleteQuestion = useDeleteQuestion(quizId);
  const reorder = useReorderQuestions(quizId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [view, setView] = useState<"question" | "settings">("question");
  const titleInitialisedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!data?.quiz) return;
    if (titleInitialisedFor.current === data.quiz.id) return;
    titleInitialisedFor.current = data.quiz.id;
    setTitleDraft(data.quiz.title);
  }, [data?.quiz]);

  useEffect(() => {
    if (!data?.questions.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !data.questions.some((q) => q.id === activeId)) {
      setActiveId(data.questions[0].id);
    }
  }, [data?.questions, activeId]);

  const activeQuestion = useMemo(
    () => data?.questions.find((q) => q.id === activeId) ?? null,
    [data?.questions, activeId],
  );
  const activeIdx = useMemo(
    () => data?.questions.findIndex((q) => q.id === activeId) ?? 0,
    [data?.questions, activeId],
  );

  const handleAddQuestion = async () => {
    const created = await createQuestion.mutateAsync({
      text: "",
      question_type: "single",
      time_limit_seconds: 20,
      points: 1000,
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
      ],
    });
    setActiveId(created.id);
  };

  const handleDeleteActive = async () => {
    if (!activeQuestion) return;
    await deleteQuestion.mutateAsync(activeQuestion.id);
    setActiveId(null);
  };

  const handleTitleBlur = () => {
    if (!data?.quiz) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === data.quiz.title) return;
    updateQuiz.mutate({ title: trimmed });
  };

  const handlePublish = async () => {
    if (!data?.quiz) return;
    await publishQuiz.mutateAsync(!data.quiz.is_published);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-page text-text-secondary">
        Загружаем квиз…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-page text-danger">
        Не удалось загрузить квиз.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex h-[72px] items-center gap-4 border-b border-divider bg-bg-surface px-8">
        <button
          type="button"
          onClick={() => navigate("/quizzes")}
          className="btn-icon"
          aria-label="Назад"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Без названия"
              className="bg-transparent text-lg font-bold text-text-primary focus:outline-none"
            />
            <Pencil className="size-3.5 text-text-tertiary" />
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span
              className={
                data.quiz.is_published ? "chip chip-success" : "chip chip-warn"
              }
            >
              {data.quiz.is_published ? "Опубликован" : "Черновик"}
            </span>
            <span>
              {data.questions.length} вопросов · Авто-сохранение
            </span>
          </div>
        </div>
        <div className="flex-1" />
        <Button
          variant={view === "settings" ? "primary" : "secondary"}
          onClick={() =>
            setView(view === "settings" ? "question" : "settings")
          }
        >
          <Settings className="size-4" />
          {view === "settings" ? "К вопросам" : "Настройки"}
        </Button>
        <Button variant="secondary" asChild>
          <Link to={`/quizzes/${data.quiz.id}`}>
            <Eye className="size-4" /> Предпросмотр
          </Link>
        </Button>
        <Button variant="secondary">
          <Play className="size-3.5" /> Запустить
        </Button>
        <Button
          onClick={handlePublish}
          disabled={publishQuiz.isPending}
          className="shadow-accent"
        >
          {data.quiz.is_published ? "Снять с публикации" : "Опубликовать"}
        </Button>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_1fr_340px]">
        <aside className="overflow-auto border-r border-divider bg-bg-surface">
          <QuizOverview
            questions={data.questions}
            activeId={view === "question" ? activeId : null}
            onSelect={(id) => {
              setActiveId(id);
              setView("question");
            }}
            onAdd={async () => {
              setView("question");
              await handleAddQuestion();
            }}
            onReorder={(order) => reorder.mutate(order)}
            canAdd={!createQuestion.isPending}
          />
        </aside>

        <main className="overflow-auto px-10 py-7">
          {view === "settings" ? (
            <QuizSettingsPanel quiz={data.quiz} />
          ) : activeQuestion ? (
            <QuestionEditor
              key={activeQuestion.id}
              orderIdx={activeIdx}
              question={activeQuestion}
              onSave={(patch) =>
                updateQuestion.mutateAsync({
                  questionId: activeQuestion.id,
                  input: {
                    text: patch.text,
                    image_url: patch.image_url,
                    question_type: patch.question_type as QuestionType,
                    time_limit_seconds: patch.time_limit_seconds,
                    points: patch.points,
                    options: patch.options,
                  },
                })
              }
              onDelete={handleDeleteActive}
            />
          ) : (
            <div className="grid place-items-center rounded-lg border-2 border-dashed border-border-strong bg-bg-surface py-24 text-text-secondary">
              <div className="text-center">
                <p className="font-display text-xl font-bold text-text-primary">
                  Вопросов пока нет
                </p>
                <p className="mt-1 text-sm">
                  Добавьте вопрос из панели слева.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
