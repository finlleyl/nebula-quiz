package quiz

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	maxTitleLen       = 200
	maxDescriptionLen = 2000
	maxQuestionText   = 1000
	maxOptionText     = 500
	maxOptions        = 10
	minOptions        = 2
	reorderShift      = 1_000_000
)

var allowedTimeLimits = map[int32]struct{}{10: {}, 20: {}, 30: {}, 60: {}}

type Service struct {
	pool *pgxpool.Pool
	q    *gen.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, q: gen.New(pool)}
}

// ---------- input / output types ----------

type CreateQuizInput struct {
	Title       string
	Description *string
	CategoryID  *uuid.UUID
	CoverURL    *string
}

type UpdateQuizInput struct {
	Title            *string
	Description      *string
	CategoryID       *uuid.UUID
	CoverURL         *string
	ClearDescription bool
	ClearCoverURL    bool
	ClearCategory    bool
}

type OptionInput struct {
	Text      string
	IsCorrect bool
}

type CreateQuestionInput struct {
	Text             string
	ImageURL         *string
	QuestionType     string
	TimeLimitSeconds int32
	Points           int32
	Options          []OptionInput
}

type UpdateQuestionInput struct {
	Text             *string
	ImageURL         *string
	QuestionType     *string
	TimeLimitSeconds *int32
	Points           *int32
	Options          *[]OptionInput // nil = don't touch options; non-nil = replace
}

type QuestionWithOptions struct {
	Question gen.Question
	Options  []gen.AnswerOption
}

type QuizBundle struct {
	Quiz      gen.Quiz
	Questions []QuestionWithOptions
}

// ---------- quiz ops ----------

func (s *Service) CreateQuiz(ctx context.Context, ownerID uuid.UUID, in CreateQuizInput) (gen.Quiz, error) {
	title := strings.TrimSpace(in.Title)
	if title == "" || len(title) > maxTitleLen {
		return gen.Quiz{}, fmt.Errorf("%w: title length must be 1..%d", ErrValidation, maxTitleLen)
	}
	if in.Description != nil && len(*in.Description) > maxDescriptionLen {
		return gen.Quiz{}, fmt.Errorf("%w: description too long", ErrValidation)
	}
	return s.q.CreateQuiz(ctx, gen.CreateQuizParams{
		OwnerID:     ownerID,
		CategoryID:  in.CategoryID,
		Title:       title,
		Description: in.Description,
		CoverUrl:    in.CoverURL,
	})
}

func (s *Service) ListQuizzesByOwner(ctx context.Context, ownerID uuid.UUID, limit, offset int32) ([]gen.Quiz, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	total, err := s.q.CountQuizzesByOwner(ctx, ownerID)
	if err != nil {
		return nil, 0, err
	}
	items, err := s.q.ListQuizzesByOwner(ctx, gen.ListQuizzesByOwnerParams{
		OwnerID: ownerID, Limit: limit, Offset: offset,
	})
	return items, total, err
}

// GetQuizBundle returns quiz + nested questions/options. The caller is
// responsible for masking is_correct in the DTO layer based on viewer role.
func (s *Service) GetQuizBundle(ctx context.Context, quizID uuid.UUID) (*QuizBundle, error) {
	q, err := s.q.GetQuizByID(ctx, quizID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrQuizNotFound
		}
		return nil, err
	}
	questions, err := s.q.ListQuestionsByQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}
	options, err := s.q.ListAnswerOptionsByQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}
	byQ := make(map[uuid.UUID][]gen.AnswerOption, len(questions))
	for _, o := range options {
		byQ[o.QuestionID] = append(byQ[o.QuestionID], o)
	}
	out := &QuizBundle{Quiz: q, Questions: make([]QuestionWithOptions, 0, len(questions))}
	for _, qq := range questions {
		out.Questions = append(out.Questions, QuestionWithOptions{Question: qq, Options: byQ[qq.ID]})
	}
	return out, nil
}

func (s *Service) UpdateQuiz(ctx context.Context, quizID, actorID uuid.UUID, actorRole string, in UpdateQuizInput) (gen.Quiz, error) {
	if _, err := s.loadOwned(ctx, quizID, actorID, actorRole); err != nil {
		return gen.Quiz{}, err
	}
	if in.Title != nil {
		t := strings.TrimSpace(*in.Title)
		if t == "" || len(t) > maxTitleLen {
			return gen.Quiz{}, fmt.Errorf("%w: title length must be 1..%d", ErrValidation, maxTitleLen)
		}
		in.Title = &t
	}
	if in.Description != nil && len(*in.Description) > maxDescriptionLen {
		return gen.Quiz{}, fmt.Errorf("%w: description too long", ErrValidation)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return gen.Quiz{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.q.WithTx(tx)

	updated, err := qtx.UpdateQuiz(ctx, gen.UpdateQuizParams{
		ID:          quizID,
		Title:       in.Title,
		Description: in.Description,
		CoverUrl:    in.CoverURL,
		CategoryID:  in.CategoryID,
	})
	if err != nil {
		return gen.Quiz{}, err
	}
	if in.ClearDescription {
		if err := qtx.ClearQuizDescription(ctx, quizID); err != nil {
			return gen.Quiz{}, err
		}
		updated.Description = nil
	}
	if in.ClearCoverURL {
		if err := qtx.ClearQuizCoverURL(ctx, quizID); err != nil {
			return gen.Quiz{}, err
		}
		updated.CoverUrl = nil
	}
	if in.ClearCategory {
		if err := qtx.ClearQuizCategory(ctx, quizID); err != nil {
			return gen.Quiz{}, err
		}
		updated.CategoryID = nil
	}
	if err := tx.Commit(ctx); err != nil {
		return gen.Quiz{}, err
	}
	return updated, nil
}

func (s *Service) DeleteQuiz(ctx context.Context, quizID, actorID uuid.UUID, actorRole string) error {
	if _, err := s.loadOwned(ctx, quizID, actorID, actorRole); err != nil {
		return err
	}
	return s.q.DeleteQuiz(ctx, quizID)
}

func (s *Service) SetPublished(ctx context.Context, quizID, actorID uuid.UUID, actorRole string, published bool) error {
	owned, err := s.loadOwned(ctx, quizID, actorID, actorRole)
	if err != nil {
		return err
	}
	if published {
		qs, err := s.q.ListQuestionsByQuiz(ctx, owned.ID)
		if err != nil {
			return err
		}
		if len(qs) == 0 {
			return fmt.Errorf("%w: cannot publish quiz without questions", ErrValidation)
		}
	}
	return s.q.SetQuizPublished(ctx, gen.SetQuizPublishedParams{ID: quizID, IsPublished: published})
}

func (s *Service) Duplicate(ctx context.Context, srcID, actorID uuid.UUID, actorRole string) (gen.Quiz, error) {
	owned, err := s.loadOwned(ctx, srcID, actorID, actorRole)
	if err != nil {
		return gen.Quiz{}, err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return gen.Quiz{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.q.WithTx(tx)

	newQuiz, err := qtx.DuplicateQuiz(ctx, owned.ID)
	if err != nil {
		return gen.Quiz{}, err
	}

	srcQuestions, err := qtx.ListQuestionsByQuiz(ctx, owned.ID)
	if err != nil {
		return gen.Quiz{}, err
	}
	srcOptions, err := qtx.ListAnswerOptionsByQuiz(ctx, owned.ID)
	if err != nil {
		return gen.Quiz{}, err
	}
	byQ := make(map[uuid.UUID][]gen.AnswerOption, len(srcQuestions))
	for _, o := range srcOptions {
		byQ[o.QuestionID] = append(byQ[o.QuestionID], o)
	}
	for _, q := range srcQuestions {
		newQ, err := qtx.CreateQuestionAt(ctx, gen.CreateQuestionAtParams{
			QuizID: newQuiz.ID, OrderIdx: q.OrderIdx, Text: q.Text,
			ImageUrl: q.ImageUrl, QuestionType: q.QuestionType,
			TimeLimitSeconds: q.TimeLimitSeconds, Points: q.Points,
		})
		if err != nil {
			return gen.Quiz{}, err
		}
		for _, o := range byQ[q.ID] {
			if _, err := qtx.InsertAnswerOption(ctx, gen.InsertAnswerOptionParams{
				QuestionID: newQ.ID, Text: o.Text, IsCorrect: o.IsCorrect, OrderIdx: o.OrderIdx,
			}); err != nil {
				return gen.Quiz{}, err
			}
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return gen.Quiz{}, err
	}
	return newQuiz, nil
}

// ---------- question ops ----------

func (s *Service) CreateQuestion(ctx context.Context, quizID, actorID uuid.UUID, actorRole string, in CreateQuestionInput) (QuestionWithOptions, error) {
	if _, err := s.loadOwned(ctx, quizID, actorID, actorRole); err != nil {
		return QuestionWithOptions{}, err
	}
	if err := validateQuestionCreate(in); err != nil {
		return QuestionWithOptions{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return QuestionWithOptions{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.q.WithTx(tx)

	q, err := qtx.CreateQuestion(ctx, gen.CreateQuestionParams{
		QuizID:           quizID,
		Text:             in.Text,
		ImageUrl:         in.ImageURL,
		QuestionType:     gen.QuestionType(in.QuestionType),
		TimeLimitSeconds: in.TimeLimitSeconds,
		Points:           in.Points,
	})
	if err != nil {
		return QuestionWithOptions{}, err
	}
	opts, err := insertOptions(ctx, qtx, q.ID, in.Options)
	if err != nil {
		return QuestionWithOptions{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return QuestionWithOptions{}, err
	}
	return QuestionWithOptions{Question: q, Options: opts}, nil
}

func (s *Service) UpdateQuestion(ctx context.Context, questionID, actorID uuid.UUID, actorRole string, in UpdateQuestionInput) (QuestionWithOptions, error) {
	existing, err := s.q.GetQuestionByID(ctx, questionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return QuestionWithOptions{}, ErrQuestionNotFound
		}
		return QuestionWithOptions{}, err
	}
	if _, err := s.loadOwned(ctx, existing.QuizID, actorID, actorRole); err != nil {
		return QuestionWithOptions{}, err
	}
	effectiveType := string(existing.QuestionType)
	if in.QuestionType != nil {
		effectiveType = *in.QuestionType
	}
	if err := validateQuestionUpdate(in, effectiveType); err != nil {
		return QuestionWithOptions{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return QuestionWithOptions{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.q.WithTx(tx)

	var qtype gen.NullQuestionType
	if in.QuestionType != nil {
		qtype = gen.NullQuestionType{QuestionType: gen.QuestionType(*in.QuestionType), Valid: true}
	}
	updated, err := qtx.UpdateQuestion(ctx, gen.UpdateQuestionParams{
		ID:               questionID,
		Text:             in.Text,
		ImageUrl:         in.ImageURL,
		QuestionType:     qtype,
		TimeLimitSeconds: in.TimeLimitSeconds,
		Points:           in.Points,
	})
	if err != nil {
		return QuestionWithOptions{}, err
	}

	var options []gen.AnswerOption
	if in.Options != nil {
		if err := qtx.DeleteAnswerOptionsByQuestion(ctx, questionID); err != nil {
			return QuestionWithOptions{}, err
		}
		options, err = insertOptions(ctx, qtx, questionID, *in.Options)
		if err != nil {
			return QuestionWithOptions{}, err
		}
	} else {
		options, err = qtx.ListAnswerOptionsByQuestion(ctx, questionID)
		if err != nil {
			return QuestionWithOptions{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return QuestionWithOptions{}, err
	}
	return QuestionWithOptions{Question: updated, Options: options}, nil
}

func (s *Service) DeleteQuestion(ctx context.Context, questionID, actorID uuid.UUID, actorRole string) error {
	existing, err := s.q.GetQuestionByID(ctx, questionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrQuestionNotFound
		}
		return err
	}
	if _, err := s.loadOwned(ctx, existing.QuizID, actorID, actorRole); err != nil {
		return err
	}
	return s.q.DeleteQuestion(ctx, questionID)
}

func (s *Service) ReorderQuestions(ctx context.Context, quizID, actorID uuid.UUID, actorRole string, order []uuid.UUID) error {
	if _, err := s.loadOwned(ctx, quizID, actorID, actorRole); err != nil {
		return err
	}
	existing, err := s.q.ListQuestionsByQuiz(ctx, quizID)
	if err != nil {
		return err
	}
	if len(existing) != len(order) {
		return ErrReorderMismatch
	}
	known := make(map[uuid.UUID]struct{}, len(existing))
	for _, q := range existing {
		known[q.ID] = struct{}{}
	}
	seen := make(map[uuid.UUID]struct{}, len(order))
	for _, id := range order {
		if _, ok := known[id]; !ok {
			return ErrReorderMismatch
		}
		if _, dup := seen[id]; dup {
			return ErrReorderMismatch
		}
		seen[id] = struct{}{}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.q.WithTx(tx)

	if err := qtx.ShiftQuestionOrderIdx(ctx, quizID); err != nil {
		return err
	}
	for i, id := range order {
		if err := qtx.SetQuestionOrderIdx(ctx, gen.SetQuestionOrderIdxParams{
			ID: id, QuizID: quizID, OrderIdx: int32(i),
		}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ---------- helpers ----------

func (s *Service) loadOwned(ctx context.Context, quizID, actorID uuid.UUID, actorRole string) (gen.Quiz, error) {
	q, err := s.q.GetQuizByID(ctx, quizID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return gen.Quiz{}, ErrQuizNotFound
		}
		return gen.Quiz{}, err
	}
	if actorRole != "admin" && q.OwnerID != actorID {
		return gen.Quiz{}, ErrForbidden
	}
	return q, nil
}

func insertOptions(ctx context.Context, qtx *gen.Queries, questionID uuid.UUID, opts []OptionInput) ([]gen.AnswerOption, error) {
	out := make([]gen.AnswerOption, 0, len(opts))
	for i, o := range opts {
		inserted, err := qtx.InsertAnswerOption(ctx, gen.InsertAnswerOptionParams{
			QuestionID: questionID,
			Text:       o.Text,
			IsCorrect:  o.IsCorrect,
			OrderIdx:   int32(i),
		})
		if err != nil {
			return nil, err
		}
		out = append(out, inserted)
	}
	return out, nil
}

func validateQuestionCreate(in CreateQuestionInput) error {
	if strings.TrimSpace(in.Text) == "" || len(in.Text) > maxQuestionText {
		return fmt.Errorf("%w: text length must be 1..%d", ErrValidation, maxQuestionText)
	}
	if in.QuestionType != string(gen.QuestionTypeSingle) && in.QuestionType != string(gen.QuestionTypeMultiple) {
		return fmt.Errorf("%w: question_type must be 'single' or 'multiple'", ErrValidation)
	}
	if _, ok := allowedTimeLimits[in.TimeLimitSeconds]; !ok {
		return fmt.Errorf("%w: time_limit_seconds must be one of 10, 20, 30, 60", ErrValidation)
	}
	if in.Points <= 0 || in.Points > 10_000 {
		return fmt.Errorf("%w: points must be 1..10000", ErrValidation)
	}
	return validateOptions(in.Options, in.QuestionType)
}

func validateQuestionUpdate(in UpdateQuestionInput, effectiveType string) error {
	if in.Text != nil && (strings.TrimSpace(*in.Text) == "" || len(*in.Text) > maxQuestionText) {
		return fmt.Errorf("%w: text length must be 1..%d", ErrValidation, maxQuestionText)
	}
	if in.QuestionType != nil {
		qt := *in.QuestionType
		if qt != string(gen.QuestionTypeSingle) && qt != string(gen.QuestionTypeMultiple) {
			return fmt.Errorf("%w: question_type must be 'single' or 'multiple'", ErrValidation)
		}
	}
	if in.TimeLimitSeconds != nil {
		if _, ok := allowedTimeLimits[*in.TimeLimitSeconds]; !ok {
			return fmt.Errorf("%w: time_limit_seconds must be one of 10, 20, 30, 60", ErrValidation)
		}
	}
	if in.Points != nil && (*in.Points <= 0 || *in.Points > 10_000) {
		return fmt.Errorf("%w: points must be 1..10000", ErrValidation)
	}
	if in.Options != nil {
		return validateOptions(*in.Options, effectiveType)
	}
	return nil
}

func validateOptions(opts []OptionInput, questionType string) error {
	if len(opts) < minOptions || len(opts) > maxOptions {
		return fmt.Errorf("%w: options count must be %d..%d", ErrValidation, minOptions, maxOptions)
	}
	correct := 0
	for i, o := range opts {
		if strings.TrimSpace(o.Text) == "" || len(o.Text) > maxOptionText {
			return fmt.Errorf("%w: option[%d] text length must be 1..%d", ErrValidation, i, maxOptionText)
		}
		if o.IsCorrect {
			correct++
		}
	}
	if correct == 0 {
		return fmt.Errorf("%w: at least one option must be correct", ErrValidation)
	}
	// When question_type is known, enforce single has exactly one correct.
	if questionType == string(gen.QuestionTypeSingle) && correct != 1 {
		return fmt.Errorf("%w: single-choice must have exactly one correct option", ErrValidation)
	}
	return nil
}
