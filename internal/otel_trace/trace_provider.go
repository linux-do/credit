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

package otel_trace

import (
	"context"
	"os"

	"github.com/linux-do/credit/internal/config"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func newTracerProvider() (*sdktrace.TracerProvider, error) {
	// 获取主机名和容器信息
	hostname, err := os.Hostname()
	if err != nil {
		return nil, err
	}

	// 初始化 Resource
	r, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(config.Config.App.AppName),
			semconv.HostName(hostname),
			semconv.K8SNamespaceName(os.Getenv("KUBERNETES_NAMESPACE")),
			semconv.K8SPodName(os.Getenv("KUBERNETES_POD_NAME")),
			semconv.K8SPodUID(os.Getenv("KUBERNETES_POD_UID")),
		),
	)
	if err != nil {
		return nil, err
	}

	// 初始化 Exporter
	traceExporter, err := otlptracegrpc.New(context.Background())
	if err != nil {
		return nil, err
	}

	// 初始化 Trace
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(r),
		sdktrace.WithSampler(ParentBasedErrorAwareSampler(config.Config.Otel.SamplingRate)),
	)
	return tracerProvider, nil
}
