/**
 * API 错误类型定义
 */

/**
 * API 错误基类
 */
export class ApiErrorBase extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiErrorBase.prototype);
  }
}

/**
 * 网络错误
 */
export class NetworkError extends ApiErrorBase {
  constructor(message = "网络连接失败，请检查您的网络") {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends ApiErrorBase {
  constructor(message = "请求超时，请稍后重试") {
    super(message);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * 未授权错误 (401)
 */
export class UnauthorizedError extends ApiErrorBase {
  constructor(message = "未授权，请先登录") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 权限不足错误 (403)
 */
export class ForbiddenError extends ApiErrorBase {
  constructor(message = "权限不足") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 资源未找到错误 (404)
 */
export class NotFoundError extends ApiErrorBase {
  constructor(message = "请求的资源不存在") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 服务器错误 (5xx)
 */
export class ServerError extends ApiErrorBase {
  constructor(message = "服务器内部错误，请稍后重试", statusCode = 500) {
    super(message, "SERVER_ERROR", statusCode);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * 验证错误 (400)
 */
export class ValidationError extends ApiErrorBase {
  constructor(message = "请求参数验证失败", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 检查错误是否为请求取消错误
 * @param error - 错误对象
 * @returns 是否为取消错误
 */
export function isCancelError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    (("__CANCEL__" in error &&
      (error as { __CANCEL__?: boolean }).__CANCEL__ === true) ||
      ("message" in error &&
        (error as { message?: string }).message === "请求已被取消"))
  );
}
