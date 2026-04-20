package imagestore

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

type uploadResponse struct {
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Size   int64  `json:"size"`
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(MaxImageSize + 1<<20); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_multipart", err.Error())
		return
	}
	f, header, err := r.FormFile("file")
	if err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "missing_file", "field `file` is required")
		return
	}
	res, err := h.svc.UploadImage(r.Context(), f, header.Size)
	_ = f.Close()
	if err != nil {
		switch {
		case errors.Is(err, ErrTooLarge):
			httpapi.WriteProblem(w, http.StatusRequestEntityTooLarge, "image_too_large", "max 5MB")
		case errors.Is(err, ErrEmpty):
			httpapi.WriteProblem(w, http.StatusBadRequest, "empty_file", "")
		case errors.Is(err, ErrInvalidFormat), errors.Is(err, ErrDecodeFailed):
			httpapi.WriteProblem(w, http.StatusUnsupportedMediaType, "invalid_format", "only jpeg, png, webp are accepted")
		default:
			httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(uploadResponse{
		URL: res.URL, Width: res.Width, Height: res.Height, Size: res.Size,
	})
}
