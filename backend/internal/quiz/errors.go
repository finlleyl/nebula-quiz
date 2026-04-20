package quiz

import "errors"

var (
	ErrQuizNotFound     = errors.New("quiz_not_found")
	ErrQuestionNotFound = errors.New("question_not_found")
	ErrForbidden        = errors.New("forbidden")
	ErrValidation       = errors.New("validation_failed")
	ErrReorderMismatch  = errors.New("reorder_mismatch")
)
