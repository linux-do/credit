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

package util

// Response 通用响应体
type Response[T any] struct {
	ErrorMsg  string `json:"error_msg"`
	ErrorCode string `json:"error_code,omitempty"`
	Data      T      `json:"data"`
}

// ResponseAny 用于 Swagger 文档的响应类型（非泛型）
// swag 不支持泛型，使用此类型替代 Response[T]
type ResponseAny struct {
	ErrorMsg  string      `json:"error_msg" example:""`
	ErrorCode string      `json:"error_code,omitempty" example:""`
	Data      interface{} `json:"data"`
}

// OK 构造成功响应
func OK[T any](data T) Response[T] {
	return Response[T]{Data: data}
}

// OKNil 构造成功响应（data 为 null）
func OKNil() Response[any] {
	return Response[any]{Data: nil}
}

// Err 构造错误响应
func Err(msg string) Response[any] {
	return Response[any]{ErrorMsg: msg, Data: nil}
}

// ErrCode 构造带稳定错误码的错误响应
func ErrCode(code, msg string) Response[any] {
	return Response[any]{
		ErrorMsg:  msg,
		ErrorCode: code,
		Data:      nil,
	}
}
