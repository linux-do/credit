import { BaseService } from '../core/base.service';
import type { UploadImageResponse } from './types';

/**
 * 上传服务
 * 处理文件上传相关的 API 请求
 */
export class UploadService extends BaseService {
  protected static readonly basePath = '/api/v1/upload';

  /**
   * 上传红包封面图片
   * @param file - 图片文件
   * @param type - 封面类型 (cover: 背景封面, heterotypic: 异形装饰)
   * @returns 上传后的图片URL
   * @throws {ValidationError} 当文件格式或大小不符合要求时
   * @throws {UnauthorizedError} 当未登录时
   *
   * @example
   * ```typescript
   * const file = e.target.files[0];
   * const result = await UploadService.uploadRedEnvelopeCover(file, 'cover');
   * console.log('图片URL:', result.url);
   * ```
   */
  static async uploadRedEnvelopeCover(
    file: File,
    type: 'cover' | 'heterotypic'
  ): Promise<UploadImageResponse> {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('只支持 JPG、PNG、WEBP 格式的图片');
    }

    // 验证文件大小 (最大 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片大小不能超过 2MB');
    }

    // 创建 FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.post<UploadImageResponse>('/redenvelope/cover', formData);
  }

  /**
   * 将 base64 图片转换为 Blob 并上传
   * @param base64 - base64 编码的图片
   * @param type - 封面类型
   * @param filename - 文件名
   * @returns 上传后的图片URL
   */
  static async uploadBase64Image(
    base64: string,
    type: 'cover' | 'heterotypic',
    filename: string = 'image.png'
  ): Promise<UploadImageResponse> {
    // 将 base64 转换为 Blob
    const response = await fetch(base64);
    const blob = await response.blob();
    
    // 创建 File 对象，确保正确的 MIME 类型
    const mimeType = base64.match(/data:([^;]+);/)?.[1] || 'image/png';
    const file = new File([blob], filename, { type: mimeType });
    
    // 上传文件
    return this.uploadRedEnvelopeCover(file, type);
  }
}