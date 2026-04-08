/*
Copyright 2025 linux.do

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package storage

import (
	"context"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/linux-do/credit/internal/config"
)

// S3Storage implements Storage using S3-compatible APIs (e.g. Cloudflare R2)
type S3Storage struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

// NewS3Storage creates a new S3-compatible storage client
func NewS3Storage(cfg config.StorageConfig) (*S3Storage, error) {
	s3Cfg := aws.Config{
		Region: cfg.Region,
		Credentials: credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		),
	}

	client := s3.NewFromConfig(s3Cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(cfg.Endpoint)
	})

	publicURL := strings.TrimRight(cfg.PublicURL, "/")

	return &S3Storage{
		client:    client,
		bucket:    cfg.Bucket,
		publicURL: publicURL,
	}, nil
}

// Put uploads a file to S3
func (s *S3Storage) Put(ctx context.Context, key string, reader io.Reader, size int64, contentType string) error {
	input := &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          reader,
		ContentLength: aws.Int64(size),
		ContentType:   aws.String(contentType),
	}

	_, err := s.client.PutObject(ctx, input)
	return err
}

// Delete removes a file from S3
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}

	_, err := s.client.DeleteObject(ctx, input)
	return err
}

// PublicURL returns the publicly accessible URL for the given key
func (s *S3Storage) PublicURL(key string) string {
	return s.publicURL + "/" + key
}
