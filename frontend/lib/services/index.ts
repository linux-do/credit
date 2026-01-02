/**
 * 服务层统一入口
 * 提供所有业务服务的访问接口
 * 
 * @example
 * ```typescript
 * // 推荐：使用统一的 services 对象
 * import services from '@/lib/services';
 * 
 * const user = await services.auth.getUserInfo();
 * const transactions = await services.transaction.getTransactions({ page: 1, page_size: 20 });
 * ```
 * 
 * @example
 * ```typescript
 * // 按需导入：直接导入特定服务
 * import { AuthService } from '@/lib/services';
 * 
 * const user = await AuthService.getUserInfo();
 * ```
 */

import { AuthService } from './auth';
import { TransactionService } from './transaction';
import { MerchantService } from './merchant';
import { AdminService } from './admin';
import { UserService } from './user';
import { DisputeService } from './dispute';
import { ConfigService } from './config';
import { DashboardService } from './dashboard';
import { RedEnvelopeService } from './redenvelope';

/**
 * 服务对象
 * 集中导出所有业务服务
 * 
 * @description
 * 推荐使用此对象访问所有服务，保持代码风格统一
 */
const services = {
  /** 认证服务 */
  auth: AuthService,
  /** 交易服务 */
  transaction: TransactionService,
  /** 商户服务 */
  merchant: MerchantService,
  /** 管理员服务 */
  admin: AdminService,
  /** 用户服务 */
  user: UserService,
  /** 争议服务 */
  dispute: DisputeService,
  /** 配置服务 */
  config: ConfigService,
  /** 仪表板服务 */
  dashboard: DashboardService,
  /** 红包服务 */
  redEnvelope: RedEnvelopeService,
} as const;

export default services;

// ==================== 核心模块导出 ====================

export {
  apiClient,
  BaseService,
  apiConfig,
  cancelRequest,
  cancelAllRequests,
} from './core';

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
} from './core';

export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginationResponse,
  RequestConfig,
} from './core';

// ==================== 业务服务导出 ====================

// 认证服务
export { AuthService, TrustLevel } from './auth';
export type {
  User,
  OAuthLoginUrlResponse,
  OAuthCallbackRequest,
} from './auth';

// 交易服务
export { TransactionService } from './transaction';
export type {
  Order,
  OrderType,
  OrderStatus,
  TransactionQueryParams,
  TransactionListResponse,
  TransferRequest,
  TransferResponse,
} from './transaction';


// 争议服务
export { DisputeService } from './dispute';
export type {
  Dispute,
  DisputeStatus,
  DisputeWithOrder,
  ListDisputesRequest,
  ListDisputesResponse,
  RefundReviewRequest,
  CloseDisputeRequest,
  CreateDisputeRequest,
} from './dispute';

// 配置服务
export { ConfigService } from './config';
export type {
  PublicConfigResponse,
} from './config';

// 商户服务
export { MerchantService } from './merchant';
export type {
  MerchantAPIKey,
  CreateAPIKeyRequest,
  UpdateAPIKeyRequest,
  PayMerchantOrderRequest,
  GetMerchantOrderRequest,
  GetMerchantOrderResponse,
  PaymentLink,
  CreatePaymentLinkRequest,
  QueryMerchantOrderRequest,
  QueryMerchantOrderResponse,
  RefundMerchantOrderRequest,
  RefundMerchantOrderResponse,
  GetPaymentLinkInfoResponse,
} from './merchant';

// 管理员服务
export { AdminService } from './admin';
export type {
  SystemConfig,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest,
  UserPayConfig,
  CreateUserPayConfigRequest,
  UpdateUserPayConfigRequest,
  TaskMeta,
  DispatchTaskRequest,
  AdminUser,
  ListUsersRequest,
  ListUsersResponse,
  UpdateUserStatusRequest,
} from './admin';

// 用户服务
export { UserService } from './user';
export type { UpdatePayKeyRequest } from './user';

// 仪表板服务
export { DashboardService } from './dashboard';
export type {
  DailyStatsItem,
  DailyStatsResponse,
  GetDailyStatsRequest,
  TopCustomer,
  TopCustomersResponse,
  GetTopCustomersRequest,
} from './dashboard';

// 红包服务
export { RedEnvelopeService } from './redenvelope';
export type {
  RedEnvelopeType,
  RedEnvelopeStatus,
  RedEnvelope,
  RedEnvelopeClaim,
  CreateRedEnvelopeRequest,
  CreateRedEnvelopeResponse,
  ClaimRedEnvelopeRequest,
  ClaimRedEnvelopeResponse,
  RedEnvelopeDetailResponse,
  RedEnvelopeListParams,
  RedEnvelopeListResponse,
} from './redenvelope';

