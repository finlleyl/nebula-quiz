import { ArrowLeft, Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { QuestionEditor } from "@/features/quiz-builder/QuestionEditor";
import { QuizOverview } from "@/features/quiz-builder/QuizOverview";
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
      <div className="grid min-h-screen place-items-center bg-bg-primary text-text-secondary">
        Loading quiz…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-primary text-accent-error">
        Failed to load quiz.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-primary/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1536px] items-center gap-6 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate("/quizzes")}
            className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to My Quizzes
          </button>

          <div className="flex-1 min-w-0">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Untitled quiz"
              className="w-full truncate bg-transparent font-display text-[28px] font-bold text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <p className="mt-1 text-sm text-text-muted">
              {data.quiz.is_published ? "Published" : "Editing Draft"} ·{" "}
              {data.questions.length} Questions
            </p>
          </div>

          <Button variant="outline" size="md" className="gap-2" asChild>
            <Link to={`/quizzes/${data.quiz.id}`}>
              <Eye className="size-4" />
              Preview
            </Link>
          </Button>
          <Button
            size="md"
            onClick={handlePublish}
            disabled={publishQuiz.isPending}
          >
            {data.quiz.is_published ? "Unpublish" : "Publish Quiz"}
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1536px] grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <section>
          {activeQuestion ? (
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
            <div className="grid place-items-center rounded-[24px] border border-dashed border-border bg-bg-card/40 py-24 text-text-secondary">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-text-primary">
                  No questions yet
                </p>
                <p className="mt-2">Add one from the panel on the right.</p>
              </div>
            </div>
          )}
        </section>

        <aside className="lg:h-[calc(100vh-140px)] lg:sticky lg:top-[96px]">
          <QuizOverview
            questions={data.questions}
            activeId={activeId}
            onSelect={setActiveId}
            onAdd={handleAddQuestion}
            onReorder={(order) => reorder.mutate(order)}
            canAdd={!createQuestion.isPending}
          />
        </aside>
      </main>
    </div>
  );
}
