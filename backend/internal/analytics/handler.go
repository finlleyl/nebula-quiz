package analytics

import (
	"encoding/json"
	"net/http"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
	"github.com/finlleyl/nebula-quiz/internal/httpapi/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GET /api/v1/analytics/overview
func (h *Handler) Overview(w http.ResponseWriter, r *http.Request) {
	hostID, ok := middleware.UserID(r)
	if !ok {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "")
		return
	}

	overview, err := h.svc.GetOverview(r.Context(), hostID)
	if err != nil {
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal error", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(overview)
}
