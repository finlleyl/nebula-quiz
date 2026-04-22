package realtime

import (
	"log/slog"

	"github.com/google/uuid"
)

type inboundMsg struct {
	client *Client
	env    Envelope
}

// Room manages a single game session's live state in a single goroutine.
type Room struct {
	code string
	hub  *Hub

	register   chan *Client
	unregister chan *Client
	inbound    chan inboundMsg

	// All fields below are accessed only from run().
	clients map[uuid.UUID]*Client // participantID -> client
	host    *Client
	status  RoomStatus
}

func newRoom(code string, hub *Hub) *Room {
	return &Room{
		code:       code,
		hub:        hub,
		register:   make(chan *Client, 8),
		unregister: make(chan *Client, 8),
		inbound:    make(chan inboundMsg, 64),
		clients:    make(map[uuid.UUID]*Client),
		status:     RoomStatusLobby,
	}
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
		}
	}
}

// handleJoin adds a client to the room and broadcasts presence.
func (r *Room) handleJoin(c *Client) {
	r.clients[c.participantID] = c
	if c.isHost {
		r.host = c
	}

	// Send the joining client the current room state.
	r.sendRoomState(c)

	// Broadcast participant.joined to everyone else.
	if !c.isHost {
		joined := ParticipantJoinedPayload{
			Participant: r.participantSummary(c),
		}
		r.broadcastExcept(MsgParticipantJoined, joined, c.participantID)
	}

	slog.Info("room join", "code", r.code, "participant", c.participantID, "isHost", c.isHost)
}

// handleLeave removes a client and broadcasts departure.
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

	// If no clients remain, the room goroutine exits via defer.
	if len(r.clients) == 0 {
		return
	}
}

// handleMessage dispatches a client message to the appropriate handler.
func (r *Room) handleMessage(c *Client, env Envelope) {
	switch env.Type {
	case MsgParticipantReady:
		r.handleParticipantReady(c)
	case MsgHostStartGame:
		r.handleHostStartGame(c)
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

func (r *Room) handleHostStartGame(c *Client) {
	if !r.validateHost(c) {
		return
	}
	if r.status != RoomStatusLobby {
		c.sendMsg(MsgError, ErrorPayload{Code: "invalid_state", Message: "game already started"})
		return
	}
	r.status = RoomStatusInProgress
	// Broadcast updated room state — gameplay handled in Sprint 5.
	r.broadcastAll(MsgRoomState, r.buildRoomStatePayload())
}

func (r *Room) handleHostEndGame(c *Client) {
	if !r.validateHost(c) {
		return
	}
	r.status = RoomStatusFinished
	r.broadcastAll(MsgRoomState, r.buildRoomStatePayload())
}

// validateHost returns true and sends an error to the client if not host.
func (r *Room) validateHost(c *Client) bool {
	if !c.isHost {
		c.sendMsg(MsgError, ErrorPayload{Code: "forbidden", Message: "host only"})
		return false
	}
	return true
}

// sendRoomState sends the full room state to a single client.
func (r *Room) sendRoomState(c *Client) {
	c.sendMsg(MsgRoomState, r.buildRoomStatePayload())
}

func (r *Room) buildRoomStatePayload() RoomStatePayload {
	participants := make([]ParticipantSummary, 0, len(r.clients))
	for _, c := range r.clients {
		if !c.isHost {
			participants = append(participants, r.participantSummary(c))
		}
	}
	var hostSummary HostSummary
	if r.host != nil {
		hostSummary = HostSummary{DisplayName: r.host.nickname}
	}
	idx := (*int)(nil)
	return RoomStatePayload{
		RoomCode:             r.code,
		Status:               r.status,
		Quiz:                 QuizSummary{},
		Host:                 hostSummary,
		Participants:         participants,
		CurrentQuestionIndex: idx,
	}
}

func (r *Room) participantSummary(c *Client) ParticipantSummary {
	return ParticipantSummary{
		ID:       c.participantID.String(),
		Nickname: c.nickname,
		Status:   ParticipantJoined,
		Score:    0,
	}
}

// broadcastAll sends a message to every connected client.
func (r *Room) broadcastAll(msgType MessageType, payload any) {
	b, err := encodeEnvelope(msgType, payload)
	if err != nil {
		slog.Error("broadcast encode", "err", err)
		return
	}
	for _, c := range r.clients {
		select {
		case c.send <- b:
		default:
			slog.Warn("broadcast drop", "participant", c.participantID)
		}
	}
}

// broadcastExcept sends to all clients except the one with the given participantID.
func (r *Room) broadcastExcept(msgType MessageType, payload any, except uuid.UUID) {
	b, err := encodeEnvelope(msgType, payload)
	if err != nil {
		slog.Error("broadcastExcept encode", "err", err)
		return
	}
	for id, c := range r.clients {
		if id == except {
			continue
		}
		select {
		case c.send <- b:
		default:
		}
	}
}
