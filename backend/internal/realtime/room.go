package realtime

import (
	"context"
	"log/slog"
	"math"
	"sort"
	"time"

	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/google/uuid"
)

type inboundMsg struct {
	client *Client
	env    Envelope
}

// questionWithOptions bundles a question row with its answer options.
type questionWithOptions struct {
	q       gen.Question
	options []gen.AnswerOption
}

// playerAnswer records a single participant's submission for the active question.
type playerAnswer struct {
	optionIDs      []uuid.UUID
	responseTimeMs int32
	isCorrect      bool
	scoreAwarded   int32
}

// Room manages a single game session's live state in one goroutine.
type Room struct {
	code        string    // sessionID.String() — hub map key
	roomCode    string    // 7-char display code e.g. "7X9-2B4"
	sessionID   uuid.UUID
	quizID      uuid.UUID
	quizTitle   string
	totalQs     int
	matchNumber int32
	hub         *Hub

	register   chan *Client
	unregister chan *Client
	inbound    chan inboundMsg

	// ---- state: only accessed from run() ----

	clients map[uuid.UUID]*Client // participantID → client (includes host)
	host    *Client
	status  RoomStatus

	// Populated in handleHostStartGame
	questions []questionWithOptions

	// Per-question state
	currentIdx      int
	questionActive  bool
	questionStartTS time.Time
	answers         map[uuid.UUID]*playerAnswer // participantID → answer

	// Accumulated total scores (participantID → total score)
	scores map[uuid.UUID]int32

	// Question timer: goroutine closes questionFired when time elapses.
	// questionCancel cancels the timer goroutine early.
	questionFired  <-chan struct{}
	questionCancel context.CancelFunc

	// DB queries for persistence (nil in tests without DB)
	db *gen.Queries
}

func newRoom(
	code, roomCode string,
	hub *Hub,
	sessionID, quizID uuid.UUID,
	quizTitle string,
	totalQs int,
	matchNumber int32,
	db *gen.Queries,
) *Room {
	return &Room{
		code:        code,
		roomCode:    roomCode,
		hub:         hub,
		sessionID:   sessionID,
		quizID:      quizID,
		quizTitle:   quizTitle,
		totalQs:     totalQs,
		matchNumber: matchNumber,
		db:          db,
		register:    make(chan *Client, 8),
		unregister:  make(chan *Client, 8),
		inbound:     make(chan inboundMsg, 64),
		clients:     make(map[uuid.UUID]*Client),
		scores:      make(map[uuid.UUID]int32),
		status:      RoomStatusLobby,
	}
}

// timerC returns the active question timer channel (nil = no active timer → select case never fires).
func (r *Room) timerC() <-chan struct{} {
	return r.questionFired
}

func (r *Room) run() {
	defer r.hub.removeRoom(r.code)
	for {
		select {
		case c := <-r.register:
			r.handleJoin(c)
		case c := <-r.unregister:
			r.handleLeave(c)
		case m := <-r.inbound:
			r.handleMessage(m.client, m.env)
		case <-r.timerC():
			// Question timer fired naturally.
			r.questionFired = nil
			if r.questionCancel != nil {
				r.questionCancel()
				r.questionCancel = nil
			}
			if r.questionActive {
				r.finishQuestion(false)
			}
		}
	}
}

// ---- join / leave ----

func (r *Room) handleJoin(c *Client) {
	r.clients[c.participantID] = c
	if c.isHost {
		r.host = c
	}
	if !c.isHost {
		if _, exists := r.scores[c.participantID]; !exists {
			r.scores[c.participantID] = 0
		}
	}

	r.sendRoomState(c)

	if !c.isHost {
		r.broadcastExcept(MsgParticipantJoined, ParticipantJoinedPayload{
			Participant: r.participantSummary(c),
		}, c.participantID)
	}

	// Reconnect mid-question: replay current question.start for the player.
	if r.status == RoomStatusInProgress && r.questionActive && !c.isHost {
		c.sendMsg(MsgQuestionStart, r.buildQuestionStart(r.questions[r.currentIdx], r.currentIdx))
	}

	slog.Info("room join", "code", r.code, "participant", c.participantID, "isHost", c.isHost)
}

func (r *Room) handleLeave(c *Client) {
	if _, ok := r.clients[c.participantID]; !ok {
		return
	}
	delete(r.clients, c.participantID)
	close(c.send)

	if !c.isHost {
		r.broadcastAll(MsgParticipantLeft, ParticipantLeftPayload{
			ParticipantID: c.participantID.String(),
		})
	}

	slog.Info("room leave", "code", r.code, "participant", c.participantID)

	if len(r.clients) == 0 {
		return // run() will exit via defer
	}
}

// ---- message dispatch ----

func (r *Room) handleMessage(c *Client, env Envelope) {
	switch env.Type {
	case MsgParticipantReady:
		r.handleParticipantReady(c)
	case MsgAnswerSubmit:
		r.handleAnswerSubmit(c, env)
	case MsgHostStartGame:
		r.handleHostStartGame(c)
	case MsgHostNextQuestion:
		r.handleHostAdvance(c)
	case MsgHostSkipQuestion:
		r.handleHostAdvance(c)
	case MsgHostEndGame:
		r.handleHostEndGame(c)
	default:
		slog.Debug("unhandled ws message", "type", env.Type)
	}
}

func (r *Room) handleParticipantReady(c *Client) {
	r.broadcastAll(MsgParticipantStatus, ParticipantStatusPayload{
		ParticipantID: c.participantID.String(),
		Status:        ParticipantReady,
	})
}

// ---- host actions ----

func (r *Room) handleHostStartGame(c *Client) {
	if !r.validateHost(c) {
		return
	}
	if r.status != RoomStatusLobby {
		c.sendMsg(MsgError, ErrorPayload{Code: "invalid_state", Message: "game already started"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	questions, err := r.db.ListQuestionsByQuiz(ctx, r.quizID)
	if err != nil || len(questions) == 0 {
		c.sendMsg(MsgError, ErrorPayload{Code: "no_questions", Message: "quiz has no questions"})
		return
	}

	allOptions, err := r.db.ListAnswerOptionsByQuiz(ctx, r.quizID)
	if err != nil {
		c.sendMsg(MsgError, ErrorPayload{Code: "internal", Message: "failed to load options"})
		return
	}

	optionsByQ := make(map[uuid.UUID][]gen.AnswerOption)
	for _, opt := range allOptions {
		optionsByQ[opt.QuestionID] = append(optionsByQ[opt.QuestionID], opt)
	}

	r.questions = make([]questionWithOptions, len(questions))
	for i, q := range questions {
		r.questions[i] = questionWithOptions{q: q, options: optionsByQ[q.ID]}
	}
	r.totalQs = len(r.questions)

	r.status = RoomStatusInProgress
	_ = r.db.StartGameSession(ctx, r.sessionID)

	r.broadcastAll(MsgRoomState, r.buildRoomStatePayload())
	r.startQuestion(0)
}

// handleHostAdvance handles both host.next_question and host.skip_question.
// If a question is active it ends it early (score what exists) then advances;
// if between questions it advances directly.
func (r *Room) handleHostAdvance(c *Client) {
	if !r.validateHost(c) {
		return
	}
	if r.status != RoomStatusInProgress {
		c.sendMsg(MsgError, ErrorPayload{Code: "invalid_state", Message: "game not in progress"})
		return
	}

	if r.questionActive {
		// Cancel timer and end current question early, then advance.
		r.cancelTimer()
		r.finishQuestion(true)
	} else {
		// Already between questions: advance to next.
		r.advanceOrFinish()
	}
}

func (r *Room) handleHostEndGame(c *Client) {
	if !r.validateHost(c) {
		return
	}
	r.cancelTimer()
	r.questionActive = false
	r.finishGame()
}

// ---- player answer ----

func (r *Room) handleAnswerSubmit(c *Client, env Envelope) {
	if c.isHost {
		c.sendMsg(MsgError, ErrorPayload{Code: "forbidden", Message: "host cannot submit answers"})
		return
	}
	if r.status != RoomStatusInProgress || !r.questionActive {
		c.sendMsg(MsgError, ErrorPayload{Code: "invalid_state", Message: "no active question"})
		return
	}
	if _, already := r.answers[c.participantID]; already {
		c.sendMsg(MsgError, ErrorPayload{Code: "already_answered", Message: "already answered"})
		return
	}

	var payload AnswerSubmitPayload
	if err := jsonUnmarshal(env.Payload, &payload); err != nil {
		c.sendMsg(MsgError, ErrorPayload{Code: "bad_request", Message: "invalid payload"})
		return
	}

	optionIDs := make([]uuid.UUID, 0, len(payload.OptionIDs))
	for _, s := range payload.OptionIDs {
		id, err := uuid.Parse(s)
		if err != nil {
			c.sendMsg(MsgError, ErrorPayload{Code: "bad_request", Message: "invalid option_id"})
			return
		}
		optionIDs = append(optionIDs, id)
	}

	qwo := r.questions[r.currentIdx]
	timeLimitMS := int32(qwo.q.TimeLimitSeconds) * 1000
	responseTimeMs := int32(time.Since(r.questionStartTS).Milliseconds())
	if responseTimeMs > timeLimitMS {
		responseTimeMs = timeLimitMS
	}

	// Validate submitted IDs are real options for this question.
	validOpts := make(map[uuid.UUID]bool, len(qwo.options))
	for _, opt := range qwo.options {
		validOpts[opt.ID] = true
	}
	for _, id := range optionIDs {
		if !validOpts[id] {
			c.sendMsg(MsgError, ErrorPayload{Code: "bad_request", Message: "invalid option_id"})
			return
		}
	}

	// Strict correctness check: selected set must equal correct set exactly.
	correctSet := make(map[uuid.UUID]bool)
	for _, opt := range qwo.options {
		if opt.IsCorrect {
			correctSet[opt.ID] = true
		}
	}
	selectedSet := make(map[uuid.UUID]bool, len(optionIDs))
	for _, id := range optionIDs {
		selectedSet[id] = true
	}
	isCorrect := len(selectedSet) == len(correctSet)
	if isCorrect {
		for id := range correctSet {
			if !selectedSet[id] {
				isCorrect = false
				break
			}
		}
	}

	scoreAwarded := calcScore(qwo.q.Points, responseTimeMs, timeLimitMS, isCorrect)

	r.answers[c.participantID] = &playerAnswer{
		optionIDs:      optionIDs,
		responseTimeMs: responseTimeMs,
		isCorrect:      isCorrect,
		scoreAwarded:   scoreAwarded,
	}

	// Auto-finish if every connected participant has answered.
	nonHostCount := 0
	for _, cl := range r.clients {
		if !cl.isHost {
			nonHostCount++
		}
	}
	if nonHostCount > 0 && len(r.answers) >= nonHostCount {
		r.cancelTimer()
		r.finishQuestion(false)
	}
}

// ---- question lifecycle ----

func (r *Room) startQuestion(idx int) {
	r.cancelTimer()

	r.currentIdx = idx
	r.questionActive = true
	r.questionStartTS = time.Now()
	r.answers = make(map[uuid.UUID]*playerAnswer)

	qwo := r.questions[idx]
	timeLimitMS := int(qwo.q.TimeLimitSeconds) * 1000

	// Timer goroutine: closes done when deadline exceeded; exits on cancel.
	done := make(chan struct{})
	r.questionFired = done
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeLimitMS)*time.Millisecond)
	r.questionCancel = cancel
	go func() {
		defer cancel()
		<-ctx.Done()
		if ctx.Err() == context.DeadlineExceeded {
			close(done)
		}
	}()

	r.broadcastAll(MsgQuestionStart, r.buildQuestionStart(qwo, idx))
	slog.Info("question started", "room", r.code, "idx", idx)
}

// finishQuestion scores the current question, persists answers, broadcasts
// results, and — when thenAdvance is true — immediately starts the next.
func (r *Room) finishQuestion(thenAdvance bool) {
	r.questionActive = false

	qwo := r.questions[r.currentIdx]

	// Collect correct option IDs (for question.end — safe to reveal now).
	correctSet := make(map[uuid.UUID]bool)
	correctOptionIDs := make([]string, 0)
	for _, opt := range qwo.options {
		if opt.IsCorrect {
			correctSet[opt.ID] = true
			correctOptionIDs = append(correctOptionIDs, opt.ID.String())
		}
	}

	// Build distribution buckets.
	distribution := make(map[string]int, len(qwo.options))
	for _, opt := range qwo.options {
		distribution[opt.ID.String()] = 0
	}
	answeredCount, correctCount := 0, 0

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	for participantID, ans := range r.answers {
		answeredCount++
		if ans.isCorrect {
			correctCount++
		}
		for _, optID := range ans.optionIDs {
			distribution[optID.String()]++
		}

		r.scores[participantID] += ans.scoreAwarded

		if r.db != nil {
			if dbErr := r.db.InsertParticipantAnswer(ctx, gen.InsertParticipantAnswerParams{
				ParticipantID:     participantID,
				QuestionID:        qwo.q.ID,
				SelectedOptionIds: ans.optionIDs,
				ResponseTimeMs:    ans.responseTimeMs,
				IsCorrect:         ans.isCorrect,
				ScoreAwarded:      ans.scoreAwarded,
			}); dbErr != nil {
				slog.Error("insert answer", "err", dbErr)
			}
			if ans.scoreAwarded > 0 {
				if dbErr := r.db.AddParticipantScore(ctx, participantID, ans.scoreAwarded); dbErr != nil {
					slog.Error("add score", "err", dbErr)
				}
			}
		}
	}

	stats := QuestionStats{
		Answered:     answeredCount,
		Correct:      correctCount,
		Distribution: distribution,
	}

	// Build sorted leaderboard snapshot.
	type lbEntry struct {
		participantID uuid.UUID
		nickname      string
		score         int32
	}
	lbEntries := make([]lbEntry, 0, len(r.clients))
	for id, cl := range r.clients {
		if !cl.isHost {
			lbEntries = append(lbEntries, lbEntry{
				participantID: id,
				nickname:      cl.nickname,
				score:         r.scores[id],
			})
		}
	}
	sort.Slice(lbEntries, func(i, j int) bool {
		return lbEntries[i].score > lbEntries[j].score
	})

	top := lbEntries
	if len(top) > 10 {
		top = top[:10]
	}
	topWire := make([]LeaderboardEntry, len(top))
	for i, e := range top {
		topWire[i] = LeaderboardEntry{
			ParticipantID: e.participantID.String(),
			Nickname:      e.nickname,
			Score:         int(e.score),
		}
	}

	// Send personalized question.end + leaderboard.update to every client.
	for participantID, cl := range r.clients {
		var myResult QuestionMyResult
		if ans, ok := r.answers[participantID]; ok {
			myResult = QuestionMyResult{
				IsCorrect:    ans.isCorrect,
				ScoreAwarded: int(ans.scoreAwarded),
				TotalScore:   int(r.scores[participantID]),
			}
		} else if !cl.isHost {
			myResult = QuestionMyResult{
				IsCorrect:    false,
				ScoreAwarded: 0,
				TotalScore:   int(r.scores[participantID]),
			}
		}

		cl.sendMsg(MsgQuestionEnd, QuestionEndPayload{
			QuestionID:       qwo.q.ID.String(),
			CorrectOptionIDs: correctOptionIDs,
			Stats:            stats,
			MyResult:         myResult,
		})

		// Leaderboard (personalised rank for non-hosts).
		myRank, myScore := 0, int(r.scores[participantID])
		if !cl.isHost {
			for i, e := range lbEntries {
				if e.participantID == participantID {
					myRank = i + 1
					break
				}
			}
		}
		cl.sendMsg(MsgLeaderboardUpdate, LeaderboardUpdatePayload{
			Top:     topWire,
			MyRank:  myRank,
			MyScore: myScore,
		})
	}

	slog.Info("question finished", "room", r.code, "idx", r.currentIdx,
		"answered", answeredCount, "correct", correctCount)

	if thenAdvance {
		r.advanceOrFinish()
	}
}

func (r *Room) advanceOrFinish() {
	next := r.currentIdx + 1
	if next >= len(r.questions) {
		r.finishGame()
	} else {
		r.startQuestion(next)
	}
}

func (r *Room) finishGame() {
	r.status = RoomStatusFinished

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if r.db != nil {
		_ = r.db.FinishGameSession(ctx, r.sessionID)
	}

	// Build final leaderboard.
	type entry struct {
		participantID uuid.UUID
		nickname      string
		score         int32
	}
	entries := make([]entry, 0, len(r.clients))
	for id, cl := range r.clients {
		if !cl.isHost {
			entries = append(entries, entry{id, cl.nickname, r.scores[id]})
		}
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].score > entries[j].score
	})

	podium := make([]PodiumEntry, 0, 3)
	for i, e := range entries {
		if i >= 3 {
			break
		}
		podium = append(podium, PodiumEntry{Rank: i + 1, Nickname: e.nickname, Score: int(e.score)})
	}
	runnerUps := make([]PodiumEntry, 0)
	for i, e := range entries {
		if i < 3 {
			continue
		}
		runnerUps = append(runnerUps, PodiumEntry{Rank: i + 1, Nickname: e.nickname, Score: int(e.score)})
	}

	for participantID, cl := range r.clients {
		myRank, myScore := 0, int32(0)
		for i, e := range entries {
			if e.participantID == participantID {
				myRank = i + 1
				myScore = e.score
				break
			}
		}
		cl.sendMsg(MsgGameFinished, GameFinishedPayload{
			MatchNumber: int(r.matchNumber),
			Podium:      podium,
			RunnerUps:   runnerUps,
			Me:          MeResult{Rank: myRank, Score: int(myScore)},
		})
	}

	slog.Info("game finished", "room", r.code, "players", len(entries))
}

// ---- helpers ----

func (r *Room) cancelTimer() {
	if r.questionCancel != nil {
		r.questionCancel()
		r.questionCancel = nil
	}
	r.questionFired = nil
}

// buildQuestionStart returns the question.start payload WITHOUT is_correct — spec §14.
func (r *Room) buildQuestionStart(qwo questionWithOptions, idx int) QuestionStartPayload {
	labels := []string{"A", "B", "C", "D", "E", "F", "G", "H"}
	opts := make([]QuestionOption, 0, len(qwo.options))
	for i, opt := range qwo.options {
		label := ""
		if i < len(labels) {
			label = labels[i]
		}
		opts = append(opts, QuestionOption{
			ID:    opt.ID.String(), // UUID — NO is_correct field
			Label: label,
			Text:  opt.Text,
		})
	}
	return QuestionStartPayload{
		QuestionID:  qwo.q.ID.String(),
		Index:       idx,
		Total:       len(r.questions),
		Text:        qwo.q.Text,
		ImageURL:    qwo.q.ImageUrl,
		Type:        QuestionKind(qwo.q.QuestionType),
		Options:     opts,
		TimeLimitMS: int(qwo.q.TimeLimitSeconds) * 1000,
		ServerTS:    r.questionStartTS.UnixMilli(),
	}
}

// calcScore implements spec §12 scoring formula.
func calcScore(points, responseTimeMs, timeLimitMS int32, isCorrect bool) int32 {
	if !isCorrect || timeLimitMS <= 0 {
		return 0
	}
	ratio := float64(responseTimeMs) / float64(timeLimitMS)
	timeFactor := 1.0 - ratio*0.5
	return int32(math.Round(float64(points) * timeFactor))
}

func (r *Room) validateHost(c *Client) bool {
	if !c.isHost {
		c.sendMsg(MsgError, ErrorPayload{Code: "forbidden", Message: "host only"})
		return false
	}
	return true
}

func (r *Room) sendRoomState(c *Client) {
	c.sendMsg(MsgRoomState, r.buildRoomStatePayload())
}

func (r *Room) buildRoomStatePayload() RoomStatePayload {
	participants := make([]ParticipantSummary, 0, len(r.clients))
	for _, cl := range r.clients {
		if !cl.isHost {
			participants = append(participants, r.participantSummary(cl))
		}
	}
	var hostSummary HostSummary
	if r.host != nil {
		hostSummary = HostSummary{DisplayName: r.host.nickname}
	}
	var currentQIdx *int
	if r.questionActive {
		idx := r.currentIdx
		currentQIdx = &idx
	}
	return RoomStatePayload{
		RoomCode:             r.roomCode,
		Status:               r.status,
		Quiz:                 QuizSummary{Title: r.quizTitle, TotalQuestions: r.totalQs},
		Host:                 hostSummary,
		Participants:         participants,
		CurrentQuestionIndex: currentQIdx,
	}
}

func (r *Room) participantSummary(c *Client) ParticipantSummary {
	return ParticipantSummary{
		ID:       c.participantID.String(),
		Nickname: c.nickname,
		Status:   ParticipantJoined,
		Score:    int(r.scores[c.participantID]),
	}
}

func (r *Room) broadcastAll(msgType MessageType, payload any) {
	b, err := encodeEnvelope(msgType, payload)
	if err != nil {
		slog.Error("broadcast encode", "err", err)
		return
	}
	for _, cl := range r.clients {
		select {
		case cl.send <- b:
		default:
			slog.Warn("broadcast drop", "participant", cl.participantID)
		}
	}
}

func (r *Room) broadcastExcept(msgType MessageType, payload any, except uuid.UUID) {
	b, err := encodeEnvelope(msgType, payload)
	if err != nil {
		slog.Error("broadcastExcept encode", "err", err)
		return
	}
	for id, cl := range r.clients {
		if id == except {
			continue
		}
		select {
		case cl.send <- b:
		default:
		}
	}
}
