import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { imagesApi, questionsApi, quizzesApi } from "./api";
import type {
  CreateQuestionInput,
  CreateQuizInput,
  UpdateQuestionInput,
  UpdateQuizInput,
} from "./types";

export const quizKeys = {
  all: ["quizzes"] as const,
  list: (limit: number, offset: number) =>
    ["quizzes", "list", { limit, offset }] as const,
  detail: (id: string) => ["quizzes", "detail", id] as const,
};

export function useMyQuizzes(limit = 20, offset = 0) {
  return useQuery({
    queryKey: quizKeys.list(limit, offset),
    queryFn: () => quizzesApi.listMine({ limit, offset }),
  });
}

export function useQuiz(id: string | undefined) {
  return useQuery({
    queryKey: id ? quizKeys.detail(id) : ["quizzes", "detail", "null"],
    queryFn: () => quizzesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuizInput) => quizzesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useUpdateQuiz(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateQuizInput) => quizzesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizzesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}

export function usePublishQuiz(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isPublished: boolean) => quizzesApi.publish(id, isPublished),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useDuplicateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizzesApi.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}

export function useCreateQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) =>
      questionsApi.create(quizId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.detail(quizId) }),
  });
}

export function useUpdateQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      input,
    }: {
      questionId: string;
      input: UpdateQuestionInput;
    }) => questionsApi.update(questionId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.detail(quizId) }),
  });
}

export function useDeleteQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => questionsApi.delete(questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.detail(quizId) }),
  });
}

export function useReorderQuestions(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => questionsApi.reorder(quizId, order),
    onMutate: async (order) => {
      await qc.cancelQueries({ queryKey: quizKeys.detail(quizId) });
      const previous = qc.getQueryData(quizKeys.detail(quizId));
      qc.setQueryData(quizKeys.detail(quizId), (old: unknown) => {
        if (!old || typeof old !== "object" || !("questions" in old)) return old;
        const bundle = old as { quiz: unknown; questions: { id: string }[] };
        const indexOf = new Map(order.map((id, idx) => [id, idx]));
        const reordered = [...bundle.questions].sort(
          (a, b) =>
            (indexOf.get(a.id) ?? Infinity) - (indexOf.get(b.id) ?? Infinity),
        );
        return { ...bundle, questions: reordered };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(quizKeys.detail(quizId), ctx.previous);
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: quizKeys.detail(quizId) }),
  });
}

export function useImageUpload() {
  return useMutation({
    mutationFn: (file: File) => imagesApi.upload(file),
  });
}
