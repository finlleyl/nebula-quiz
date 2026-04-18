package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
)

func RateLimit(maxRequests int, window time.Duration) func(http.Handler) http.Handler {
	rl := newRateLimiter(maxRequests, window)
	retryAfter := strconv.Itoa(int(window.Seconds()))
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !rl.Allow(clientKey(r)) {
				w.Header().Set("Retry-After", retryAfter)
				httpapi.WriteProblem(w, http.StatusTooManyRequests, "rate_limited", "too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	max     int
	window  time.Duration
}

type bucket struct {
	count   int
	resetAt time.Time
}

func newRateLimiter(max int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		buckets: make(map[string]*bucket),
		max:     max,
		window:  window,
	}
	go rl.sweep()
	return rl
}

func (rl *rateLimiter) Allow(key string) bool {
	now := time.Now()
	rl.mu.Lock()
	defer rl.mu.Unlock()
	b, ok := rl.buckets[key]
	if !ok || now.After(b.resetAt) {
		rl.buckets[key] = &bucket{count: 1, resetAt: now.Add(rl.window)}
		return true
	}
	if b.count >= rl.max {
		return false
	}
	b.count++
	return true
}

func (rl *rateLimiter) sweep() {
	t := time.NewTicker(rl.window)
	defer t.Stop()
	for now := range t.C {
		rl.mu.Lock()
		for k, b := range rl.buckets {
			if now.After(b.resetAt) {
				delete(rl.buckets, k)
			}
		}
		rl.mu.Unlock()
	}
}

// clientKey derives the per-client bucket key. It relies on chi's RealIP
// middleware having already rewritten r.RemoteAddr with the X-Forwarded-For
// / X-Real-IP value when the server sits behind a trusted proxy.
func clientKey(r *http.Request) string {
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i >= 0 {
		host = host[:i]
	}
	host = strings.TrimPrefix(strings.TrimSuffix(host, "]"), "[")
	return host
}
