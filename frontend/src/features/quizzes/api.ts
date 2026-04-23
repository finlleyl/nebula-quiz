import { api } from "@/shared/lib/http";

import type {
  CreateQuestionInput,
  CreateQuizInput,
  ImageUploadResponse,
  ListQuizzesResponse,
  QuestionDTO,
  QuizBundleDTO,
  QuizDTO,
  UpdateQuestionInput,
  UpdateQuizInput,
} from "./types";

interface ListParams {
  limit?: number;
  offset?: number;
}

export const quizzesApi = {
  listMine: (params: ListParams = {}) => {
    const search = new URLSearchParams();
    if (params.limit != null) search.set("limit", String(params.limit));
    if (params.offset != null) search.set("offset", String(params.offset));
    const qs = search.toString();
    return api
      .get(`me/quizzes${qs ? `?${qs}` : ""}`)
      .json<ListQuizzesResponse>();
  },

  get: (id: string) => api.get(`quizzes/${id}`).json<QuizBundleDTO>(),

  create: (input: CreateQuizInput) =>
    api.post("quizzes", { json: input }).json<QuizDTO>(),

  update: (id: string, input: UpdateQuizInput) =>
    api.patch(`quizzes/${id}`, { json: input }).json<QuizDTO>(),

  delete: (id: string) => api.delete(`quizzes/${id}`).then(() => undefined),

  publish: (id: string, isPublished: boolean) =>
    api
      .post(`quizzes/${id}/publish`, { json: { is_published: isPublished } })
      .then(() => undefined),

  duplicate: (id: string) =>
    api.post(`quizzes/${id}/duplicate`).json<QuizDTO>(),
};

export const questionsApi = {
  create: (quizId: string, input: CreateQuestionInput) =>
    api.post(`quizzes/${quizId}/questions`, { json: input }).json<QuestionDTO>(),

  update: (questionId: string, input: UpdateQuestionInput) =>
    api.patch(`questions/${questionId}`, { json: input }).json<QuestionDTO>(),

  delete: (questionId: string) =>
    api.delete(`questions/${questionId}`).then(() => undefined),

  reorder: (quizId: string, order: string[]) =>
    api
      .post(`quizzes/${quizId}/questions/reorder`, { json: { order } })
      .then(() => undefined),
};

export const imagesApi = {
  upload: (file: File) => {
    const body = new FormData();
    body.set("file", file);
    return api.post("images", { body }).json<ImageUploadResponse>();
  },
};

export const libraryApi = {
  list: () => api.get("me/library").json<{ quizzes: QuizDTO[] }>(),
  save: (quizId: string) =>
    api.post(`me/library/${quizId}`).then(() => undefined),
  remove: (quizId: string) =>
    api.delete(`me/library/${quizId}`).then(() => undefined),
};
