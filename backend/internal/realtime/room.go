package realtime

import (
	"encoding/json"
	"log/slog"

	"github.com/google/uuid"
)

type inboundMsg struct {
	client *Client
	msg    Envelope
}

// Room manages one game session's WebSocket state.
// All mutation of shared state happens exclusively inside run().
type Room struct {
	Code          string
	GameSessionID uuid.UUID
	HostID        uuid.UUID

	quiz QuizInfo

	register   chan *Client
	unregister chan *Client
	inbound    chan inboundMsg
	done       chan struct{}

	// state — accessed only from run()
	clients map[uuid.UUID]*Client // participant_id → client
	host    *Client
}

// QuizInfo is the quiz metadata needed for the lobby display.
type QuizInfo struct {
	Title          string
	TotalQuestions int
}

func NewRoom(code string, sessionID, hostID uuid.UUID, quiz QuizInfo) *Room {
	return &Room{
		Code:          code,
		GameSessionID: sessionID,
		HostID:        hostID,
		quiz:          quiz,
		register:      make(chan *Client, 32),
		unregister:    make(chan *Client, 32),
		inbound:       make(chan inboundMsg, 256),
		done:          make(chan struct{}),
		clients:       make(map[uuid.UUID]*Client),
	}
}

// Run starts the room event loop; call as a goroutine.
func (r *Room) Run() {
	defer r.cleanup()
	for {
		select {
		case c := <-r.register:
			r.handleJoin(c)
		case c := <-r.unregister:
			r.handleLeave(c)
		case m := <-r.inbound:
			r.handleMessage(m.client, m.msg)
		case <-r.done:
			return
		}
	}
}

func (r *Room) Close() { close(r.done) }

// Register enqueues a client for joining the room.
func (r *Room) Register(c *Client) { r.register <- c }

func (r *Room) handleJoin(c *Client) {
	r.clients[c.ParticipantID] = c
	if c.IsHost {
		r.host = c
	}

	// Send full room state to the newcomer.
	r.sendRoomState(c)

	// Notify everyone else about the new participant (skip for host).
	if !c.IsHost {
		payload := ParticipantJoinedPayload{
			Participant: r.participantSummary(c),
		}
		r.broadcastExcept(c, mustEncode(MsgParticipantJoined, payload))
	}

	slog.Info("ws client joined room", "room", r.Code, "participant", c.ParticipantID, "host", c.IsHost)
}

func (r *Room) handleLeave(c *Client) {
	if _, ok := r.clients[c.ParticipantID]; !ok {
		return
	}
	delete(r.clients, c.ParticipantID)
	close(c.send)

	if !c.IsHost {
		payload := ParticipantLeftPayload{ParticipantID: c.ParticipantID.String()}
		r.broadcastAll(mustEncode(MsgParticipantLeft, payload))
	}

	slog.Info("ws client left room", "room", r.Code, "participant", c.ParticipantID)
}

func (r *Room) handleMessage(c *Client, env Envelope) {
	switch env.Type {
	case MsgParticipantReady:
		r.handleReady(c)
	case MsgHostStartGame:
		if !c.IsHost {
			c.Send(errEnvelope("unauthorized", "only the host can start the game"))
			return
		}
		// Sprint 5 will implement the full start game flow.
		slog.Info("host.start_game received (Sprint 5 pending)", "room", r.Code)
	case MsgHostEndGame:
		if !c.IsHost {
			c.Send(errEnvelope("unauthorized", "only the host can end the game"))
			return
		}
	default:
		c.Send(errEnvelope("unknown_type", "unrecognised message type: "+string(env.Type)))
	}
}

func (r *Room) handleReady(c *Client) {
	if c.IsHost {
		return
	}
	payload := ParticipantStatusPayload{
		ParticipantID: c.ParticipantID.String(),
		Status:        ParticipantReady,
	}
	r.broadcastAll(mustEncode(MsgParticipantStatus, payload))
}

// ---- broadcast helpers ----

func (r *Room) sendRoomState(c *Client) {
	participants := make([]ParticipantSummary, 0, len(r.clients))
	for _, cl := range r.clients {
		if !cl.IsHost {
			participants = append(participants, r.participantSummary(cl))
		}
	}
	idx := 0
	payload := RoomStatePayload{
		RoomCode: r.Code,
		Status:   RoomStatusLobby,
		Quiz:     QuizSummary{Title: r.quiz.Title, TotalQuestions: r.quiz.TotalQuestions},
		Host: HostSummary{
			DisplayName: r.hostDisplayName(),
		},
		Participants:         participants,
		CurrentQuestionIndex: &idx,
	}
	// CurrentQuestionIndex nil when lobby.
	payload.CurrentQuestionIndex = nil
	c.Send(mustEncode(MsgRoomState, payload))
}

func (r *Room) broadcastAll(env Envelope) {
	for _, c := range r.clients {
		c.Send(env)
	}
}

func (r *Room) broadcastExcept(skip *Client, env Envelope) {
	for _, c := range r.clients {
		if c != skip {
			c.Send(env)
		}
	}
}

func (r *Room) cleanup() {
	for _, c := range r.clients {
		close(c.send)
	}
}

func (r *Room) participantSummary(c *Client) ParticipantSummary {
	return ParticipantSummary{
		ID:       c.ParticipantID.String(),
		Nickname: c.Nickname,
		Status:   ParticipantJoined,
		Score:    0,
	}
}

func (r *Room) hostDisplayName() string {
	if r.host != nil {
		return r.host.Nickname
	}
	return "Game Master"
}

// ---- encoding helpers ----

func mustEncode(t MessageType, payload any) Envelope {
	raw, err := json.Marshal(payload)
	if err != nil {
		panic("realtime: marshal payload: " + err.Error())
	}
	return Envelope{Type: t, Payload: json.RawMessage(raw)}
}

func errEnvelope(code, msg string) Envelope {
	return mustEncode(MsgError, ErrorPayload{Code: code, Message: msg})
}
