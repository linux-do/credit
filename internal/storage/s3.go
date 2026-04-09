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
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/otel_trace"
	"github.com/linux-do/credit/internal/util"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

var (
	client    *s3.Client
	bucket    string
	keyPrefix string
	cdnURL    string
)

func init() {
	cfg := config.Config.S3
	if !cfg.Enabled {
		log.Println("[Storage] S3 storage disabled")
		return
	}

	bucket = cfg.Bucket
	keyPrefix = cfg.KeyPrefix
	cdnURL = strings.TrimRight(cfg.CdnURL, "/")

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(cfg.Region),
		awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		),
	)
	if err != nil {
		log.Fatalf("[Storage] failed to load AWS config: %v\n", err)
	}

	client = s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if cfg.Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		}
		o.UsePathStyle = cfg.PathStyle
	})

	log.Printf("[Storage] S3 storage initialized (bucket: %s, prefix: %s, cdn: %s)\n", bucket, keyPrefix, cdnURL)
}

func IsEnabled() bool {
	return client != nil
}

// BuildKey constructs a full S3 object key with the configured prefix.
func BuildKey(path string) string {
	return keyPrefix + path
}

// PutObject uploads a file to S3.
func PutObject(ctx context.Context, key string, body io.Reader, size int64, contentType string) error {
	ctx, span := otel_trace.Start(ctx, "S3.PutObject", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attribute.String("s3.key", key),
		attribute.Int64("s3.content_length", size),
		attribute.String("s3.content_type", contentType),
	)

	if !IsEnabled() {
		span.SetStatus(codes.Error, "S3 not initialized")
		return ErrS3InitializationFailed{}
	}

	input := &s3.PutObjectInput{
		Bucket:        aws.String(bucket),
		Key:           aws.String(key),
		Body:          body,
		ContentLength: aws.Int64(size),
		ContentType:   aws.String(contentType),
	}

	_, err := client.PutObject(ctx, input)
	if err != nil {
		span.SetStatus(codes.Error, fmt.Sprintf("S3 put object failed: %v", err))
		return fmt.Errorf("s3 put object failed: %w", err)
	}
	return nil
}

// ObjectInfo holds metadata about a retrieved object.
type ObjectInfo struct {
	Body          io.ReadCloser
	ContentLength int64
	ContentType   string
}

// GetObject retrieves a file directly from S3.
func GetObject(ctx context.Context, key string) (*ObjectInfo, error) {
	ctx, span := otel_trace.Start(ctx, "S3.GetObject", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(attribute.String("s3.key", key))

	if !IsEnabled() {
		span.SetStatus(codes.Error, "S3 not initialized")
		return nil, ErrS3InitializationFailed{}
	}

	output, err := client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		span.SetStatus(codes.Error, fmt.Sprintf("S3 get object failed: %v", err))
		return nil, fmt.Errorf("s3 get object failed: %w", err)
	}

	contentType := "application/octet-stream"
	if output.ContentType != nil {
		contentType = *output.ContentType
	}

	var contentLength int64
	if output.ContentLength != nil {
		contentLength = *output.ContentLength
	}

	return &ObjectInfo{
		Body:          output.Body,
		ContentLength: contentLength,
		ContentType:   contentType,
	}, nil
}

// GetObjectViaProxy retrieves a file via CDN if configured, otherwise falls back to S3.
func GetObjectViaProxy(ctx context.Context, key string) (*ObjectInfo, error) {
	ctx, span := otel_trace.Start(ctx, "S3.GetObjectViaProxy", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(attribute.String("s3.key", key))

	if !IsEnabled() {
		span.SetStatus(codes.Error, "S3 not initialized")
		return nil, ErrS3InitializationFailed{}
	}

	if cdnURL == "" {
		return GetObject(ctx, key)
	}

	url := cdnURL + "/" + key
	span.SetAttributes(attribute.Bool("s3.use_cdn", true))

	resp, err := util.Request(ctx, http.MethodGet, url, nil, nil, nil)
	if err != nil {
		span.SetStatus(codes.Error, fmt.Sprintf("cdn request failed: %v", err))
		return nil, fmt.Errorf("cdn request failed: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		span.SetStatus(codes.Error, fmt.Sprintf("cdn returned status %d", resp.StatusCode))
		return nil, fmt.Errorf("cdn returned status %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return &ObjectInfo{
		Body:          resp.Body,
		ContentLength: resp.ContentLength,
		ContentType:   contentType,
	}, nil
}

// DeleteObject deletes a file from S3.
func DeleteObject(ctx context.Context, key string) error {
	ctx, span := otel_trace.Start(ctx, "S3.DeleteObject", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(attribute.String("s3.key", key))

	if !IsEnabled() {
		return ErrS3InitializationFailed{}
	}

	_, err := client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		span.SetStatus(codes.Error, fmt.Sprintf("S3 delete object failed: %v", err))
		return fmt.Errorf("s3 delete object failed: %w", err)
	}
	return nil
}
