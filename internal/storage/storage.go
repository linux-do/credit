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
	"log"

	"github.com/linux-do/credit/internal/config"
)

// Storage defines the interface for file storage operations
type Storage interface {
	// Put uploads a file to storage
	Put(ctx context.Context, key string, reader io.Reader, size int64, contentType string) error

	// Delete removes a file from storage
	Delete(ctx context.Context, key string) error

	// PublicURL returns the publicly accessible URL for the given key
	PublicURL(key string) string
}

var defaultStorage Storage

func init() {
	cfg := config.Config.Storage
	if !cfg.Enabled {
		log.Println("[Storage] is disabled, skipping initialization")
		return
	}

	s3, err := NewS3Storage(cfg)
	if err != nil {
		log.Fatalf("[Storage] failed to initialize S3 storage: %v\n", err)
	}

	defaultStorage = s3
	log.Printf("[Storage] initialized S3-compatible storage (bucket: %s)\n", cfg.Bucket)
}

// Default returns the global storage instance
func Default() Storage {
	return defaultStorage
}
