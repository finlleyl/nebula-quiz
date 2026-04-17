// Package realtime defines the WebSocket wire protocol shared between the
// backend hub and the frontend store. This file mirrors §9 of the spec —
// keep it in lockstep with frontend/src/shared/lib/ws/protocol.ts.
package realtime

import "encoding/json"

// MessageType is the value of the top-level "type" field in a protocol envelope.
type MessageType string

// Client → Server.
const (
	MsgAuth             MessageType = "auth"
	MsgRoomJoin         MessageType = "room.join"
	MsgParticipantReady MessageType = "participant.ready"
	MsgAnswerSubmit     MessageType = "answer.submit"
	MsgPowerupUse       MessageType = "powerup.use"
	MsgHostStartGame    MessageType = "host.start_game"
	MsgHostNextQuestion MessageType = "host.next_question"
	MsgHostSkipQuestion MessageType = "host.skip_question"
	MsgHostEndGame      MessageType = "host.end_game"
)

// Server → Client.
const (
	MsgAuthOK            MessageType = "auth.ok"
	MsgRoomState         MessageType = "room.state"
	MsgParticipantJoined MessageType = "participant.joined"
	MsgParticipantLeft   MessageType = "participant.left"
	MsgParticipantStatus MessageType = "participant.status"
	MsgQuestionStart     MessageType = "question.start"
	MsgQuestionTick      MessageType = "question.tick"
	MsgQuestionEnd       MessageType = "question.end"
	MsgLeaderboardUpdate MessageType = "leaderboard.update"
	MsgPowerupApplied    MessageType = "powerup.applied"
	MsgGameFinished      MessageType = "game.finished"
	MsgError             MessageType = "error"
)

// Envelope is the on-wire container for every message in both directions.
// Concrete payloads live in the *Payload types below.
type Envelope struct {
	Type    MessageType     `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// --- Client → Server payloads ---

type AuthPayload struct {
	Ticket string `json:"ticket"`
}

type RoomJoinPayload struct {
	RoomCode string `json:"room_code"`
}

type AnswerSubmitPayload struct {
	QuestionID string   `json:"question_id"`
	OptionIDs  []string `json:"option_ids"`
}

// PowerupType enumerates power-ups (spec §13). MVP: only fifty_fifty.
type PowerupType string

const (
	PowerupFiftyFifty PowerupType = "fifty_fifty"
	PowerupDouble     PowerupType = "double" // post-MVP
)

type PowerupUsePayload struct {
	Type PowerupType `json:"type"`
}

// --- Server → Client payloads ---

type AuthOKPayload struct {
	UserID  string `json:"user_id"`
	IsGuest bool   `json:"is_guest"`
}

// RoomStatus is the lifecycle state of a room, matching game_status enum.
type RoomStatus string

const (
	RoomStatusLobby      RoomStatus = "lobby"
	RoomStatusInProgress RoomStatus = "in_progress"
	RoomStatusFinished   RoomStatus = "finished"
	RoomStatusAborted    RoomStatus = "aborted"
)

type QuizSummary struct {
	Title          string `json:"title"`
	TotalQuestions int    `json:"total_questions"`
}

type HostSummary struct {
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url,omitempty"`
}

// ParticipantStatus mirrors the participant_status enum.
type ParticipantStatus string

const (
	ParticipantJoined ParticipantStatus = "joined"
	ParticipantReady  ParticipantStatus = "ready"
	ParticipantVIP    ParticipantStatus = "vip"
	ParticipantLeft   ParticipantStatus = "left"
)

type ParticipantSummary struct {
	ID        string            `json:"id"`
	Nickname  string            `json:"nickname"`
	AvatarURL *string           `json:"avatar_url,omitempty"`
	Status    ParticipantStatus `json:"status"`
	Score     int               `json:"score"`
}

type RoomStatePayload struct {
	RoomCode             string               `json:"room_code"`
	Status               RoomStatus           `json:"status"`
	Quiz                 QuizSummary          `json:"quiz"`
	Host                 HostSummary          `json:"host"`
	Participants         []ParticipantSummary `json:"participants"`
	CurrentQuestionIndex *int                 `json:"current_question_index"`
}

type ParticipantJoinedPayload struct {
	Participant ParticipantSummary `json:"participant"`
}

type ParticipantLeftPayload struct {
	ParticipantID string `json:"participant_id"`
}

type ParticipantStatusPayload struct {
	ParticipantID string            `json:"participant_id"`
	Status        ParticipantStatus `json:"status"`
}

// QuestionKind mirrors the question_type enum.
type QuestionKind string

const (
	QuestionSingle   QuestionKind = "single"
	QuestionMultiple QuestionKind = "multiple"
)

type QuestionOption struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Text  string `json:"text"`
}

type QuestionStartPayload struct {
	QuestionID  string           `json:"question_id"`
	Index       int              `json:"index"`
	Total       int              `json:"total"`
	Text        string           `json:"text"`
	ImageURL    *string          `json:"image_url,omitempty"`
	Type        QuestionKind     `json:"type"`
	Options     []QuestionOption `json:"options"`
	TimeLimitMS int              `json:"time_limit_ms"`
	ServerTS    int64            `json:"server_ts"`
}

type QuestionTickPayload struct {
	RemainingMS int `json:"remaining_ms"`
}

type QuestionStats struct {
	Answered     int            `json:"answered"`
	Correct      int            `json:"correct"`
	Distribution map[string]int `json:"distribution"`
}

type QuestionMyResult struct {
	IsCorrect    bool `json:"is_correct"`
	ScoreAwarded int  `json:"score_awarded"`
	TotalScore   int  `json:"total_score"`
}

type QuestionEndPayload struct {
	QuestionID       string           `json:"question_id"`
	CorrectOptionIDs []string         `json:"correct_option_ids"`
	Stats            QuestionStats    `json:"stats"`
	MyResult         QuestionMyResult `json:"my_result"`
}

type LeaderboardEntry struct {
	ParticipantID string  `json:"participant_id"`
	Nickname      string  `json:"nickname"`
	AvatarURL     *string `json:"avatar_url,omitempty"`
	Score         int     `json:"score"`
}

type LeaderboardUpdatePayload struct {
	Top     []LeaderboardEntry `json:"top"`
	MyRank  int                `json:"my_rank"`
	MyScore int                `json:"my_score"`
}

type PowerupAppliedPayload struct {
	Type            PowerupType `json:"type"`
	HiddenOptionIDs []string    `json:"hidden_option_ids"`
}

type PodiumEntry struct {
	Rank      int     `json:"rank"`
	Nickname  string  `json:"nickname"`
	Score     int     `json:"score"`
	AvatarURL *string `json:"avatar_url,omitempty"`
}

type MeResult struct {
	Rank  int `json:"rank"`
	Score int `json:"score"`
}

type GameFinishedPayload struct {
	MatchNumber int           `json:"match_number"`
	Podium      []PodiumEntry `json:"podium"`
	RunnerUps   []PodiumEntry `json:"runner_ups"`
	Me          MeResult      `json:"me"`
}

type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
