package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
)

const refreshRandomBytes = 32

func GenerateRefreshToken() (raw string, hash []byte, err error) {
	b := make([]byte, refreshRandomBytes)
	if _, err = rand.Read(b); err != nil {
		return "", nil, err
	}
	raw = base64.RawURLEncoding.EncodeToString(b)
	h := sha256.Sum256([]byte(raw))
	return raw, h[:], nil
}

func HashRefreshToken(raw string) []byte {
	h := sha256.Sum256([]byte(raw))
	return h[:]
}
