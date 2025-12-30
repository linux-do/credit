import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
  InternalAxiosRequestConfig,
} from "axios";
import { apiConfig } from "./config";
import {
  ApiErrorBase,
  NetworkError,
  TimeoutError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  ValidationError,
} from "./errors";
import { ApiError, ApiResponse } from "./types";

/**
 * API 客户端实例
 * 统一处理请求配置、响应解析和错误处理
 */
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: apiConfig.withCredentials,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 请求取消令牌存储
 */
const cancelTokens = new Map<string, CancelTokenSource>();

/**
 * 请求缓存存储
 * 存储正在进行的请求 Promise，避免重复请求
 */
const pendingRequests = new Map<string, Promise<AxiosResponse<ApiResponse>>>();

/**
 * 生成请求的唯一键
 * 包含方法、URL 和请求数据的哈希，确保不同参数的请求不会被误取消
 */
function getRequestKey(config: {
  method?: string;
  url?: string;
  data?: unknown;
}): string {
  const baseKey = `${config.method?.toUpperCase()}_${config.url}`;

  /* 序列化加入键中 */
  if (config.data) {
    try {
      const dataHash = JSON.stringify(config.data);
      return `${baseKey}_${dataHash}`;
    } catch {
      // 失败使用基础键
      return baseKey;
    }
  }

  return baseKey;
}

/**
 * 请求拦截器
 * 添加取消令牌和其他配置
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requestKey = getRequestKey(config);
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    cancelTokens.set(requestKey, source);

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

/**
 * 直接启动登录流程
 * @param currentPath - 当前路径，用于登录成功后重定向回来
 */
function initiateLogin(currentPath: string): Promise<never> {
  if (
    !currentPath.startsWith("/login") &&
    !currentPath.startsWith("/callback")
  ) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redirect_after_login", currentPath);
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("callbackUrl", currentPath);
      window.location.href = loginUrl.toString();
    }
  }

  return new Promise<never>(() => {});
}

/**
 * 响应拦截器
 * 处理 API 响应和统一错误处理
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const requestKey = getRequestKey(response.config);
    cancelTokens.delete(requestKey);
    pendingRequests.delete(requestKey);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.config) {
      const requestKey = getRequestKey(error.config);
      cancelTokens.delete(requestKey);
      pendingRequests.delete(requestKey);
    }

    /* 请求被取消时静默处理 */
    if (axios.isCancel(error)) {
      const cancelError = new Error(
        error.message || "请求已被取消",
      ) as Error & { __CANCEL__?: boolean };
      cancelError.__CANCEL__ = true;
      return Promise.reject(cancelError);
    }

    /* 401 未授权错误 */
    if (error.response?.status === 401) {
      return initiateLogin(window.location.pathname + window.location.search);
    }

    /* 403 权限不足错误 */
    if (error.response?.status === 403) {
      return Promise.reject(
        new ForbiddenError(error.response.data?.error_msg || "权限不足"),
      );
    }

    /* 404 资源未找到错误 */
    if (error.response?.status === 404) {
      return Promise.reject(
        new NotFoundError(error.response.data?.error_msg || "请求的资源不存在"),
      );
    }

    /* 400 验证错误 */
    if (error.response?.status === 400) {
      return Promise.reject(
        new ValidationError(
          error.response.data?.error_msg || "请求参数验证失败",
          error.response.data?.details,
        ),
      );
    }

    /* 5xx 服务器错误 */
    if (error.response && error.response.status >= 500) {
      return Promise.reject(
        new ServerError(
          error.response.data?.error_msg || "服务器内部错误，请稍后重试",
          error.response.status,
        ),
      );
    }

    /* 网络超时错误 */
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return Promise.reject(new TimeoutError());
    }

    /* 网络连接错误（ECONNREFUSED, ERR_NETWORK 等） */
    if (
      !error.response ||
      error.code === "ECONNREFUSED" ||
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error") ||
      error.message?.includes("Failed to fetch")
    ) {
      return Promise.reject(
        new NetworkError("无法连接到服务器，请确认后端服务已启动"),
      );
    }

    /* 其他后端返回的错误 */
    if (error.response?.data?.error_msg) {
      return Promise.reject(
        new ApiErrorBase(
          error.response.data.error_msg,
          error.response.data.error_code,
          error.response.status,
          error.response.data.details,
        ),
      );
    }

    /* 兜底错误 */
    return Promise.reject(new ApiErrorBase(error.message || "网络请求失败"));
  },
);

/**
 * 取消指定请求
 * @param method - 请求方法
 * @param url - 请求 URL
 */
export function cancelRequest(method: string, url: string): void {
  const requestKey = `${method.toUpperCase()}_${url}`;
  const source = cancelTokens.get(requestKey);
  if (source) {
    source.cancel("请求已被手动取消");
    cancelTokens.delete(requestKey);
  }
}

/**
 * 取消所有请求
 */
export function cancelAllRequests(): void {
  cancelTokens.forEach((source) => {
    source.cancel("所有请求已被取消");
  });
  cancelTokens.clear();
}

/**
 * 创建带有请求去重功能的请求方法
 * @param method HTTP 方法名
 * @param hasBody 是否包含请求体
 */
function createRequestMethod(
  method: "get" | "post" | "put" | "patch" | "delete",
  hasBody: boolean,
) {
  if (hasBody) {
    return <T = ApiResponse>(
      url: string,
      data?: unknown,
      config?: InternalAxiosRequestConfig,
    ) => {
      const requestKey = getRequestKey({
        method: method.toUpperCase(),
        url,
        data,
      });

      if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey) as Promise<AxiosResponse<T>>;
      }

      const promise = apiClient[method]<T>(url, data, config);
      pendingRequests.set(
        requestKey,
        promise as Promise<AxiosResponse<ApiResponse>>,
      );

      promise.finally(() => {
        pendingRequests.delete(requestKey);
      });

      return promise;
    };
  }

  return <T = ApiResponse>(
    url: string,
    config?: InternalAxiosRequestConfig,
  ) => {
    const requestKey = getRequestKey({
      method: method.toUpperCase(),
      url,
      data: config?.params,
    });

    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey) as Promise<AxiosResponse<T>>;
    }

    const promise = apiClient[method]<T>(url, config);
    pendingRequests.set(
      requestKey,
      promise as Promise<AxiosResponse<ApiResponse>>,
    );

    promise.finally(() => {
      pendingRequests.delete(requestKey);
    });

    return promise;
  };
}

/**
 * 包装的 API 客户端
 * 在原有 axios 实例基础上添加请求缓存功能
 */
const wrappedApiClient = {
  get: createRequestMethod("get", false) as <T = ApiResponse>(
    url: string,
    config?: AxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>,
  post: createRequestMethod("post", true) as <T = ApiResponse>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>,
  put: createRequestMethod("put", true) as <T = ApiResponse>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>,
  patch: createRequestMethod("patch", true) as <T = ApiResponse>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>,
  delete: createRequestMethod("delete", false) as <T = ApiResponse>(
    url: string,
    config?: AxiosRequestConfig,
  ) => Promise<AxiosResponse<T>>,
};

export default wrappedApiClient;
