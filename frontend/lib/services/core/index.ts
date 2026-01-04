/**
 * 核心服务模块
 * 提供 API 请求的基础设施
 */

export {
  default as apiClient,
  cancelRequest,
  cancelAllRequests,
} from "./api-client";
export { BaseService } from "./base.service";
export { apiConfig } from "./config";
export {
  ApiErrorBase,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  ValidationError,
  isCancelError,
} from "./errors";
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginationResponse,
  RequestConfig,
} from "./types";
