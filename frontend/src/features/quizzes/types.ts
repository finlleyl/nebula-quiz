export type QuestionType = "single" | "multiple";

export interface AnswerOptionDTO {
  id?: string;
  text: string;
  is_correct: boolean;
  order_idx?: number;
}

export interface QuestionDTO {
  id: string;
  order_idx: number;
  text: string;
  image_url?: string | null;
  question_type: QuestionType;
  time_limit_seconds: number;
  points: number;
  options: AnswerOptionDTO[];
}

export interface QuizDTO {
  id: string;
  owner_id: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  is_published: boolean;
  plays_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuizBundleDTO {
  quiz: QuizDTO;
  questions: QuestionDTO[];
}

export interface ListQuizzesResponse {
  items: QuizDTO[];
  total: number;
  limit: number;
  offset: number;
}

export interface ImageUploadResponse {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface CreateQuizInput {
  title: string;
  description?: string;
  category_id?: string;
  cover_url?: string;
}

export interface UpdateQuizInput {
  title?: string;
  description?: string | null;
  category_id?: string | null;
  cover_url?: string | null;
}

export interface OptionInput {
  text: string;
  is_correct: boolean;
}

export interface CreateQuestionInput {
  text: string;
  image_url?: string | null;
  question_type: QuestionType;
  time_limit_seconds: number;
  points: number;
  options: OptionInput[];
}

export interface UpdateQuestionInput {
  text?: string;
  image_url?: string | null;
  question_type?: QuestionType;
  time_limit_seconds?: number;
  points?: number;
  options?: OptionInput[];
}
