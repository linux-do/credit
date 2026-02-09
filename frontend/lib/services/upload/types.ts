/**
 * 上传图片响应
 */
export interface UploadImageResponse {
  /** 上传记录 ID */
  id: string;
  /** 上传后的图片URL */
  url: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  size: number;
  /** 图片宽度 */
  width?: number;
  /** 图片高度 */
  height?: number;
}