package realtime

import (
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = 30 * time.Second
	maxMsgSize = 4096
)

// Client is one connected WS peer.
type Client struct {
	id            uuid.UUID
	participantID uuid.UUID
	userID        *uuid.UUID
	isHost        bool
	isGuest       bool
	nickname      string

	conn *websocket.Conn
	room *Room
	send chan []byte
}

func newClient(conn *websocket.Conn, room *Room, td *TicketData) *Client {
	return &Client{
		id:            uuid.New(),
		participantID: td.ParticipantID,
		userID:        td.UserID,
		isHost:        td.IsHost,
		isGuest:       td.IsGuest,
		nickname:      td.Nickname,
		conn:          conn,
		room:          room,
		send:          make(chan []byte, 256),
	}
}

// readPump pumps messages from the WS connection to the room inbound channel.
func (c *Client) readPump() {
	defer func() {
		c.room.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMsgSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Warn("ws read error", "participant", c.participantID, "err", err)
			}
			break
		}
		var env Envelope
		if jsonErr := jsonUnmarshal(msg, &env); jsonErr != nil {
			slog.Warn("ws bad envelope", "err", jsonErr)
			continue
		}
		c.room.inbound <- inboundMsg{client: c, env: env}
	}
}

// writePump pumps messages from the send channel to the WS connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// sendMsg encodes and queues a message; non-blocking (drops on full buffer).
func (c *Client) sendMsg(msgType MessageType, payload any) {
	b, err := encodeEnvelope(msgType, payload)
	if err != nil {
		slog.Error("encode envelope", "err", err)
		return
	}
	select {
	case c.send <- b:
	default:
		slog.Warn("ws send buffer full, dropping", "participant", c.participantID)
	}
}
