package quiz

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
	"github.com/finlleyl/nebula-quiz/internal/httpapi/middleware"
	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ---------- dto ----------

type optionDTO struct {
	ID        string `json:"id,omitempty"`
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct"`
	OrderIdx  int32  `json:"order_idx,omitempty"`
}

type questionDTO struct {
	ID               string      `json:"id"`
	OrderIdx         int32       `json:"order_idx"`
	Text             string      `json:"text"`
	ImageURL         *string     `json:"image_url,omitempty"`
	QuestionType     string      `json:"question_type"`
	TimeLimitSeconds int32       `json:"time_limit_seconds"`
	Points           int32       `json:"points"`
	Options          []optionDTO `json:"options"`
}

type quizDTO struct {
	ID          string  `json:"id"`
	OwnerID     string  `json:"owner_id"`
	CategoryID  *string `json:"category_id,omitempty"`
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	CoverURL    *string `json:"cover_url,omitempty"`
	IsPublished bool    `json:"is_published"`
	PlaysCount  int32   `json:"plays_count"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type quizBundleDTO struct {
	Quiz      quizDTO       `json:"quiz"`
	Questions []questionDTO `json:"questions"`
}

type listQuizzesDTO struct {
	Items  []quizDTO `json:"items"`
	Total  int64     `json:"total"`
	Limit  int32     `json:"limit"`
	Offset int32     `json:"offset"`
}

// ---------- request bodies ----------

type createQuizRequest struct {
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	CategoryID  *string `json:"category_id,omitempty"`
	CoverURL    *string `json:"cover_url,omitempty"`
}

type updateQuizRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	CategoryID  *string `json:"category_id,omitempty"`
	CoverURL    *string `json:"cover_url,omitempty"`
}

type publishRequest struct {
	IsPublished bool `json:"is_published"`
}

type optionRequest struct {
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct"`
}

type createQuestionRequest struct {
	Text             string          `json:"text"`
	ImageURL         *string         `json:"image_url,omitempty"`
	QuestionType     string          `json:"question_type"`
	TimeLimitSeconds int32           `json:"time_limit_seconds"`
	Points           int32           `json:"points"`
	Options          []optionRequest `json:"options"`
}

type updateQuestionRequest struct {
	Text             *string          `json:"text,omitempty"`
	ImageURL         *string          `json:"image_url,omitempty"`
	QuestionType     *string          `json:"question_type,omitempty"`
	TimeLimitSeconds *int32           `json:"time_limit_seconds,omitempty"`
	Points           *int32           `json:"points,omitempty"`
	Options          *[]optionRequest `json:"options,omitempty"`
}

type reorderRequest struct {
	Order []string `json:"order"`
}

// ---------- handlers ----------

func (h *Handler) ListMyQuizzes(w http.ResponseWriter, r *http.Request) {
	actorID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "")
		return
	}
	limit, offset := parsePagination(r)
	items, total, err := h.svc.ListQuizzesByOwner(r.Context(), actorID, limit, offset)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
		return
	}
	resp := listQuizzesDTO{
		Items: make([]quizDTO, 0, len(items)), Total: total, Limit: limit, Offset: offset,
	}
	for _, q := range items {
		resp.Items = append(resp.Items, quizToDTO(q))
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	actorID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "")
		return
	}
	var in createQuizRequest
	if err := decodeJSON(r, &in); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	catID, err := parseOptionalUUID(in.CategoryID)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_category_id", "")
		return
	}
	quiz, err := h.svc.CreateQuiz(r.Context(), actorID, CreateQuizInput{
		Title: in.Title, Description: in.Description, CategoryID: catID, CoverURL: in.CoverURL,
	})
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, quizToDTO(quiz))
}

func (h *Handler) GetQuiz(w http.ResponseWriter, r *http.Request) {
	quizID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_id", "")
		return
	}
	// Inside RequireAuth group — ok is always true; guard for future changes.
	actorID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "")
		return
	}
	actorRole, _ := middleware.UserRole(r)

	bundle, err := h.svc.GetQuizBundle(r.Context(), quizID)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	isOwner := bundle.Quiz.OwnerID == actorID
	isAdmin := actorRole == "admin"
	if !isOwner && !isAdmin && !bundle.Quiz.IsPublished {
		httpapi.WriteProblem(w, http.StatusNotFound, "quiz_not_found", "")
		return
	}
	writeJSON(w, http.StatusOK, bundleToDTO(bundle, isOwner || isAdmin))
}

func (h *Handler) UpdateQuiz(w http.ResponseWriter, r *http.Request) {
	actorID, role, quizID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	var in updateQuizRequest
	if err := decodeJSON(r, &in); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}

	// Nullable-clearing convention: empty string clears description / cover_url / category_id.
	input := UpdateQuizInput{Title: in.Title}
	if in.Description != nil {
		if *in.Description == "" {
			input.ClearDescription = true
		} else {
			input.Description = in.Description
		}
	}
	if in.CoverURL != nil {
		if *in.CoverURL == "" {
			input.ClearCoverURL = true
		} else {
			input.CoverURL = in.CoverURL
		}
	}
	if in.CategoryID != nil {
		if *in.CategoryID == "" {
			input.ClearCategory = true
		} else {
			id, err := uuid.Parse(*in.CategoryID)
			if err != nil {
				httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_category_id", "")
				return
			}
			input.CategoryID = &id
		}
	}
	updated, err := h.svc.UpdateQuiz(r.Context(), quizID, actorID, role, input)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, quizToDTO(updated))
}

func (h *Handler) DeleteQuiz(w http.ResponseWriter, r *http.Request) {
	actorID, role, quizID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	if err := h.svc.DeleteQuiz(r.Context(), quizID, actorID, role); err != nil {
		writeDomainError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Publish(w http.ResponseWriter, r *http.Request) {
	actorID, role, quizID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	in := publishRequest{IsPublished: true}
	// Body optional: default publish=true if empty.
	if r.ContentLength > 0 {
		if err := decodeJSON(r, &in); err != nil {
			httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
			return
		}
	}
	if err := h.svc.SetPublished(r.Context(), quizID, actorID, role, in.IsPublished); err != nil {
		writeDomainError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Duplicate(w http.ResponseWriter, r *http.Request) {
	actorID, role, quizID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	newQuiz, err := h.svc.Duplicate(r.Context(), quizID, actorID, role)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, quizToDTO(newQuiz))
}

func (h *Handler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	actorID, role, quizID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	var in createQuestionRequest
	if err := decodeJSON(r, &in); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	qwo, err := h.svc.CreateQuestion(r.Context(), quizID, actorID, role, CreateQuestionInput{
		Text: in.Text, ImageURL: in.ImageURL, QuestionType: in.QuestionType,
		TimeLimitSeconds: in.TimeLimitSeconds, Points: in.Points,
		Options: toOptionInputs(in.Options),
	})
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, questionToDTO(qwo, true))
}

func (h *Handler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	actorID, role, questionID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	var in updateQuestionRequest
	if err := decodeJSON(r, &in); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	var opts *[]OptionInput
	if in.Options != nil {
		conv := toOptionInputs(*in.Options)
		opts = &conv
	}
	qwo, err := h.svc.UpdateQuestion(r.Context(), questionID, actorID, role, UpdateQuestionInput{
		Text: in.Text, ImageURL: in.ImageURL, QuestionType: in.QuestionType,
		TimeLimitSeconds: in.TimeLimitSeconds, Points: in.Points, Options: opts,
	})
	if err != nil {
		writeDomainError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, questionToDTO(qwo, true))
}

func (h *Handler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	actorID, role, questionID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	if err := h.svc.DeleteQuestion(r.Context(), questionID, actorID, role); err != nil {
		writeDomainError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ReorderQuestions(w http.ResponseWriter, r *http.Request) {
	actorID, role, quizID, ok := actorAndID(w, r)
	if !ok {
		return
	}
	var in reorderRequest
	if err := decodeJSON(r, &in); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	order := make([]uuid.UUID, 0, len(in.Order))
	for _, raw := range in.Order {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_id", "malformed question id in order")
			return
		}
		order = append(order, id)
	}
	if err := h.svc.ReorderQuestions(r.Context(), quizID, actorID, role, order); err != nil {
		writeDomainError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- shared helpers ----------

func actorAndID(w http.ResponseWriter, r *http.Request) (uuid.UUID, string, uuid.UUID, bool) {
	actorID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "")
		return uuid.UUID{}, "", uuid.UUID{}, false
	}
	role, _ := middleware.UserRole(r)
	quizID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_id", "")
		return uuid.UUID{}, "", uuid.UUID{}, false
	}
	return actorID, role, quizID, true
}

func parsePagination(r *http.Request) (int32, int32) {
	limit := int32(20)
	offset := int32(0)
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 {
			limit = int32(n)
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = int32(n)
		}
	}
	return limit, offset
}

func parseOptionalUUID(raw *string) (*uuid.UUID, error) {
	if raw == nil || *raw == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*raw)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func toOptionInputs(src []optionRequest) []OptionInput {
	out := make([]OptionInput, 0, len(src))
	for _, o := range src {
		out = append(out, OptionInput{Text: o.Text, IsCorrect: o.IsCorrect})
	}
	return out
}

func quizToDTO(q gen.Quiz) quizDTO {
	var catID *string
	if q.CategoryID != nil {
		s := q.CategoryID.String()
		catID = &s
	}
	return quizDTO{
		ID: q.ID.String(), OwnerID: q.OwnerID.String(), CategoryID: catID,
		Title: q.Title, Description: q.Description, CoverURL: q.CoverUrl,
		IsPublished: q.IsPublished, PlaysCount: q.PlaysCount,
		CreatedAt: q.CreatedAt.Time.UTC().Format("2006-01-02T15:04:05Z"),
		UpdatedAt: q.UpdatedAt.Time.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func questionToDTO(qwo QuestionWithOptions, showCorrect bool) questionDTO {
	opts := make([]optionDTO, 0, len(qwo.Options))
	for _, o := range qwo.Options {
		dto := optionDTO{ID: o.ID.String(), Text: o.Text, OrderIdx: o.OrderIdx}
		if showCorrect {
			dto.IsCorrect = o.IsCorrect
		}
		opts = append(opts, dto)
	}
	return questionDTO{
		ID: qwo.Question.ID.String(), OrderIdx: qwo.Question.OrderIdx,
		Text: qwo.Question.Text, ImageURL: qwo.Question.ImageUrl,
		QuestionType:     string(qwo.Question.QuestionType),
		TimeLimitSeconds: qwo.Question.TimeLimitSeconds,
		Points:           qwo.Question.Points,
		Options:          opts,
	}
}

func bundleToDTO(b *QuizBundle, showCorrect bool) quizBundleDTO {
	qs := make([]questionDTO, 0, len(b.Questions))
	for _, q := range b.Questions {
		qs = append(qs, questionToDTO(q, showCorrect))
	}
	return quizBundleDTO{Quiz: quizToDTO(b.Quiz), Questions: qs}
}

func decodeJSON(r *http.Request, v any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(v)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrQuizNotFound):
		httpapi.WriteProblem(w, http.StatusNotFound, "quiz_not_found", "")
	case errors.Is(err, ErrQuestionNotFound):
		httpapi.WriteProblem(w, http.StatusNotFound, "question_not_found", "")
	case errors.Is(err, ErrForbidden):
		httpapi.WriteProblem(w, http.StatusForbidden, "forbidden", "")
	case errors.Is(err, ErrReorderMismatch):
		httpapi.WriteProblem(w, http.StatusBadRequest, "reorder_mismatch", "order must contain exactly all question ids")
	case errors.Is(err, ErrValidation):
		httpapi.WriteProblem(w, http.StatusBadRequest, "validation_failed", err.Error())
	default:
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
	}
}
