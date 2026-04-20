package imagestore

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"io"
	"strings"

	_ "image/jpeg"
	_ "image/png"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"golang.org/x/image/webp"
)

const (
	MaxImageSize int64 = 5 << 20 // 5 MiB
)

var (
	ErrTooLarge       = errors.New("image_too_large")
	ErrInvalidFormat  = errors.New("invalid_format")
	ErrEmpty          = errors.New("empty_file")
	ErrDecodeFailed   = errors.New("decode_failed")
	ErrStorageFailure = errors.New("storage_failure")
)

type Config struct {
	Endpoint      string
	AccessKey     string
	SecretKey     string
	Bucket        string
	UseSSL        bool
	PublicBaseURL string
}

type Service struct {
	cfg    Config
	client *minio.Client
}

type UploadResult struct {
	URL    string
	Width  int
	Height int
	Size   int64
}

func New(ctx context.Context, cfg Config) (*Service, error) {
	cli, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio.New: %w", err)
	}
	svc := &Service{cfg: cfg, client: cli}
	if err := svc.ensureBucket(ctx); err != nil {
		return nil, err
	}
	return svc, nil
}

func (s *Service) ensureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.cfg.Bucket)
	if err != nil {
		return fmt.Errorf("bucket exists: %w", err)
	}
	if exists {
		return nil
	}
	if err := s.client.MakeBucket(ctx, s.cfg.Bucket, minio.MakeBucketOptions{}); err != nil {
		return fmt.Errorf("make bucket: %w", err)
	}
	policy := fmt.Sprintf(`{
"Version":"2012-10-17",
"Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]
}`, s.cfg.Bucket)
	if err := s.client.SetBucketPolicy(ctx, s.cfg.Bucket, policy); err != nil {
		return fmt.Errorf("set bucket policy: %w", err)
	}
	return nil
}

// UploadImage reads the file contents from r (bounded by MaxImageSize+1),
// validates the image, and stores it in MinIO. hintedSize is the
// client-reported multipart size (trusted only as a fast-path hint).
func (s *Service) UploadImage(ctx context.Context, r io.Reader, hintedSize int64) (*UploadResult, error) {
	if hintedSize > MaxImageSize {
		return nil, ErrTooLarge
	}
	buf, err := io.ReadAll(io.LimitReader(r, MaxImageSize+1))
	if err != nil {
		return nil, fmt.Errorf("read upload: %w", err)
	}
	if int64(len(buf)) > MaxImageSize {
		return nil, ErrTooLarge
	}
	if len(buf) == 0 {
		return nil, ErrEmpty
	}

	width, height, ext, contentType, err := decodeImage(buf)
	if err != nil {
		return nil, err
	}

	key := fmt.Sprintf("uploads/%s.%s", uuid.NewString(), ext)
	_, err = s.client.PutObject(ctx, s.cfg.Bucket, key, bytes.NewReader(buf), int64(len(buf)),
		minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrStorageFailure, err)
	}

	return &UploadResult{
		URL:    fmt.Sprintf("%s/%s/%s", strings.TrimRight(s.cfg.PublicBaseURL, "/"), s.cfg.Bucket, key),
		Width:  width,
		Height: height,
		Size:   int64(len(buf)),
	}, nil
}

func decodeImage(buf []byte) (width, height int, ext, contentType string, err error) {
	cfg, format, dErr := image.DecodeConfig(bytes.NewReader(buf))
	if dErr == nil {
		switch format {
		case "jpeg":
			return cfg.Width, cfg.Height, "jpg", "image/jpeg", nil
		case "png":
			return cfg.Width, cfg.Height, "png", "image/png", nil
		}
	}
	if wcfg, werr := webp.DecodeConfig(bytes.NewReader(buf)); werr == nil {
		return wcfg.Width, wcfg.Height, "webp", "image/webp", nil
	}
	if dErr != nil {
		return 0, 0, "", "", fmt.Errorf("%w: %v", ErrDecodeFailed, dErr)
	}
	return 0, 0, "", "", ErrInvalidFormat
}
