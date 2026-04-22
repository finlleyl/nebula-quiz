package quiz

import (
	"net/http"
	"strconv"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
	"github.com/finlleyl/nebula-quiz/internal/httpapi/middleware"
	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// Explore — GET /explore?q=&category=&page=
func (h *Handler) Explore(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	categoryStr := r.URL.Query().Get("category")
	pageStr := r.URL.Query().Get("page")
	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	const pageSize = 20
	offset := int32((page - 1) * pageSize)

	var categoryID *uuid.UUID
	if categoryStr != "" {
		id, err := uuid.Parse(categoryStr)
		if err == nil {
			categoryID = &id
		}
	}

	var (
		quizzes []gen.Quiz
		err     error
	)
	if q != "" || categoryID != nil {
		quizzes, err = h.svc.SearchPublished(r.Context(), q, categoryID, pageSize, offset)
	} else {
		quizzes, err = h.svc.ListPublished(r.Context(), pageSize, offset)
	}
	if err != nil {
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
		return
	}

	dtos := make([]quizDTO, 0, len(quizzes))
	for _, qz := range quizzes {
		dtos = append(dtos, quizToDTO(qz))
	}
	writeJSON(w, http.StatusOK, map[string]any{"quizzes": dtos, "page": page})
}

// Categories — GET /categories
func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.svc.ListCategories(r.Context())
	if err != nil {
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
		return
	}
	type catDTO struct {
		ID   string  `json:"id"`
		Name string  `json:"name"`
		Slug string  `json:"slug"`
		Icon *string `json:"icon,omitempty"`
	}
	dtos := make([]catDTO, 0, len(cats))
	for _, c := range cats {
		dtos = append(dtos, catDTO{
			ID:   c.ID.String(),
			Name: c.Name,
			Slug: c.Slug,
			Icon: c.Icon,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"categories": dtos})
}

// Library — GET /me/library
func (h *Handler) ListLibrary(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserID(r)
	quizzes, err := h.svc.ListLibrary(r.Context(), userID)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
		return
	}
	dtos := make([]quizDTO, 0, len(quizzes))
	for _, qz := range quizzes {
		dtos = append(dtos, quizToDTO(qz))
	}
	writeJSON(w, http.StatusOK, map[string]any{"quizzes": dtos})
}

// SaveToLibrary — POST /me/library/:quiz_id
func (h *Handler) SaveToLibrary(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserID(r)
	quizIDStr := chi.URLParam(r, "quiz_id")
	quizID, err := uuid.Parse(quizIDStr)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "bad_request", "invalid quiz_id")
		return
	}

	if err := h.svc.SaveToLibrary(r.Context(), userID, quizID); err != nil {
		writeDomainError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// RemoveFromLibrary — DELETE /me/library/:quiz_id
func (h *Handler) RemoveFromLibrary(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserID(r)
	quizIDStr := chi.URLParam(r, "quiz_id")
	quizID, err := uuid.Parse(quizIDStr)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "bad_request", "invalid quiz_id")
		return
	}

	if err := h.svc.RemoveFromLibrary(r.Context(), userID, quizID); err != nil {
		writeDomainError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
