import apiClient from './api-client';
import { ApiResponse } from './types';
import { InternalAxiosRequestConfig } from 'axios';

/**
 * 服务基类
 * 提供通用的 HTTP 方法封装
 * 
 * @example
 * ```typescript
 * class UserService extends BaseService {
 *   protected static readonly basePath = '/api/v1/users';
 *   
 *   static async getAll() {
 *     return this.get<User[]>('/');
 *   }
 * }
 * ```
 */
export class BaseService {
  /**
   * API 基础路径
   * 子类必须重写此属性
   */
  protected static readonly basePath: string = '';

  /**
   * 获取完整的 API 路径
   * @param path - API 路径
   * @returns 完整路径
   */
  protected static getFullPath(path: string): string {
    return `${this.basePath}${path}`;
  }

  /**
   * GET 请求
   * @template T - 响应数据类型
   * @param path - API 路径
   * @param params - 查询参数
   * @param config - 额外的请求配置
   * @returns 响应数据
   */
  protected static async get<T>(
    path: string,
    params?: Record<string, unknown>,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    const requestConfig: InternalAxiosRequestConfig = {
      ...config,
      params,
    } as InternalAxiosRequestConfig;
    const response = await apiClient.get<ApiResponse<T>>(
      this.getFullPath(path),
      requestConfig,
    );
    return response.data.data;
  }

  /**
   * POST 请求
   * @template T - 响应数据类型
   * @param path - API 路径
   * @param data - 请求数据
   * @param config - 额外的请求配置
   * @returns 响应数据
   */
  protected static async post<T>(
    path: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(
      this.getFullPath(path),
      data,
      config,
    );
    return response.data.data;
  }

  /**
   * PUT 请求
   * @template T - 响应数据类型
   * @param path - API 路径
   * @param data - 请求数据
   * @param config - 额外的请求配置
   * @returns 响应数据
   */
  protected static async put<T>(
    path: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(
      this.getFullPath(path),
      data,
      config,
    );
    return response.data.data;
  }

  /**
   * PATCH 请求
   * @template T - 响应数据类型
   * @param path - API 路径
   * @param data - 请求数据
   * @param config - 额外的请求配置
   * @returns 响应数据
   */
  protected static async patch<T>(
    path: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.patch<ApiResponse<T>>(
      this.getFullPath(path),
      data,
      config,
    );
    return response.data.data;
  }

  /**
   * DELETE 请求
   * @template T - 响应数据类型
   * @param path - API 路径
   * @param params - 查询参数
   * @param config - 额外的请求配置
   * @returns 响应数据
   */
  protected static async delete<T>(
    path: string,
    params?: Record<string, unknown>,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    const requestConfig: InternalAxiosRequestConfig = {
      ...config,
      params,
    } as InternalAxiosRequestConfig;
    const response = await apiClient.delete<ApiResponse<T>>(
      this.getFullPath(path),
      requestConfig,
    );
    return response.data.data;
  }
}

