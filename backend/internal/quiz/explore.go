package quiz

import (
	"context"

	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/google/uuid"
)

// ListPublished returns paginated published quizzes for the Explore page.
func (s *Service) ListPublished(ctx context.Context, limit, offset int32) ([]gen.Quiz, error) {
	return s.q.ListPublishedQuizzes(ctx, gen.ListPublishedQuizzesParams{
		Limit:  limit,
		Offset: offset,
	})
}

// SearchPublished returns filtered published quizzes.
func (s *Service) SearchPublished(ctx context.Context, query string, categoryID *uuid.UUID, limit, offset int32) ([]gen.Quiz, error) {
	return s.q.SearchPublishedQuizzes(ctx, gen.SearchPublishedQuizzesParams{
		Limit:      limit,
		Offset:     offset,
		CategoryID: categoryID,
		Query:      query,
	})
}

// ListCategories returns all quiz categories.
func (s *Service) ListCategories(ctx context.Context) ([]gen.Category, error) {
	return s.q.ListCategories(ctx)
}

// SaveToLibrary bookmarks a quiz for the user.
func (s *Service) SaveToLibrary(ctx context.Context, userID, quizID uuid.UUID) error {
	// Verify quiz exists and is published before saving.
	q, err := s.q.GetQuizByID(ctx, quizID)
	if err != nil {
		return ErrQuizNotFound
	}
	if !q.IsPublished {
		return ErrForbidden
	}
	return s.q.SaveQuiz(ctx, userID, quizID)
}

// RemoveFromLibrary removes a quiz bookmark for the user.
func (s *Service) RemoveFromLibrary(ctx context.Context, userID, quizID uuid.UUID) error {
	return s.q.UnsaveQuiz(ctx, userID, quizID)
}

// ListLibrary returns all quizzes saved by the user.
func (s *Service) ListLibrary(ctx context.Context, userID uuid.UUID) ([]gen.Quiz, error) {
	return s.q.ListSavedQuizzesByUser(ctx, userID)
}
