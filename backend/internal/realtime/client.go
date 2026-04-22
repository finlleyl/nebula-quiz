package realtime

import (
	"encoding/json"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = 30 * time.Second
	maxMessageSize = 4096
)

// Client represents one connected WebSocket peer.
type Client struct {
	ID            uuid.UUID
	ParticipantID uuid.UUID
	GameSessionID uuid.UUID
	IsHost        bool
	IsGuest       bool
	Nickname      string

	room *Room
	conn *websocket.Conn
	send chan []byte
}

func NewClient(conn *websocket.Conn) *Client {
	return &Client{
		conn: conn,
		send: make(chan []byte, 256),
	}
}

// ReadPump pumps messages from the WebSocket connection into the room's inbound channel.
func (c *Client) ReadPump(room *Room) {
	c.room = room
	defer func() {
		room.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Warn("ws read error", "err", err)
			}
			return
		}
		var env Envelope
		if err := json.Unmarshal(msg, &env); err != nil {
			continue
		}
		room.inbound <- inboundMsg{client: c, msg: env}
	}
}

// WritePump pumps messages from the send channel to the WebSocket connection.
func (c *Client) WritePump() {
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

// Send enqueues a message for writing; drops silently if the channel is full.
func (c *Client) Send(env Envelope) {
	data, err := json.Marshal(env)
	if err != nil {
		return
	}
	select {
	case c.send <- data:
	default:
	}
}
