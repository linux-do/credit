"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag } from "lucide-react"

import type { GetMerchantOrderResponse } from "@/lib/services"


/**
 * 加载中骨架组件
 * 显示订单信息加载中的骨架
 */
function LoadingSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-6 text-center md:text-left">
        <Skeleton className="h-4 w-32 mb-2 bg-white/10 mx-auto md:mx-0" />
        <Skeleton className="h-8 w-40 bg-white/10 mx-auto md:mx-0" />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-white/5 p-4 space-y-4">
          <div className="flex justify-between items-start pb-4">
            <div className="flex flex-col items-start space-y-1.5">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-3 w-16 bg-white/10" />
            </div>
            <div className="flex flex-col items-end space-y-1.5">
              <Skeleton className="h-4 w-20 bg-white/10" />
              <Skeleton className="h-3 w-24 bg-white/10" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-6 w-20 bg-white/10" />
            <Skeleton className="h-6 w-24 bg-white/10" />
          </div>
        </div>

        <div className="space-y-1.5 px-1">
          <Skeleton className="h-3 w-full bg-white/10" />
          <Skeleton className="h-3 w-3/4 bg-white/10" />
        </div>
      </div>
    </div>
  )
}

/**
 * 订单信息组件
 * 显示订单信息
 */
function OrderContent({ orderInfo }: { orderInfo: GetMerchantOrderResponse }) {
  const amount = parseFloat(orderInfo.order.amount).toFixed(2)
  const feeRateValue = orderInfo.user_pay_config?.fee_rate
  const feeRate = feeRateValue ? (parseFloat(feeRateValue) * 100).toFixed(2) : '0.00'

  return (
    <div className="w-full">
      <div className="mb-4 md:mb-6 text-center md:text-left">
        <div className="inline-flex items-center justify-center md:justify-start gap-1.5 md:gap-2 mb-1 md:mb-1.5 text-white/50 text-[10px] md:text-xs font-medium uppercase tracking-wider">
          <span>支付给</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-white hover:text-blue-400 transition-colors cursor-pointer font-bold">{orderInfo.merchant.app_name}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight flex items-baseline justify-center md:justify-start gap-1">
          <span className="text-lg md:text-2xl text-white/50 font-normal">LDC</span>
          {amount}
        </h1>
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="rounded-2xl bg-white/5 p-3 md:p-4 backdrop-blur-sm transition-colors">
          <div className="flex justify-between items-start pb-3 md:pb-4 mb-3 md:mb-4">
            <div className="flex flex-col items-start pr-3 md:pr-4">
              <p className="text-xs md:text-sm font-medium text-white mb-0.5 line-clamp-2">{orderInfo.order.order_name}</p>
              <p className="text-white/40 text-[10px]">数量: 1</p>
            </div>
            <div className="flex flex-col items-end text-right whitespace-nowrap">
              <p className="text-xs md:text-sm font-medium text-white mb-0.5">LDC {amount}</p>
              <p className="text-white/40 text-[10px]">LDC {amount} / 个</p>
            </div>
          </div>

          <button className="w-full text-xs text-left mb-3 text-white/40 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
            <span>添加促销码</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/30">暂未开放</span>
          </button>

          <div className="flex justify-between items-center pt-2">
            <p className="text-base font-bold text-white">应付合计</p>
            <p className="text-lg font-bold text-white tracking-tight">LDC {amount}</p>
          </div>
        </div>

        <div className="px-2">
          <p className="text-[10px] text-white/30 space-y-0.5 leading-relaxed">
            * 包含 {feeRate}% 手续费 (由商家承担)。
            <br />
            手续费率根据商家等级动态调整，不会增加您的支付金额。
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * 支付信息组件
 * 显示支付信息
 */
export function PayingInfo({ orderInfo, loading = false }: { orderInfo: GetMerchantOrderResponse, loading: boolean }) {

  return (
    <div className="flex flex-col w-full md:w-[45%] p-4 md:p-8 justify-center bg-gradient-to-br from-neutral-900/95 to-black dark:from-neutral-900 dark:to-black relative text-white rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xs mx-auto relative z-10 flex flex-col md:h-full justify-center md:min-h-[360px]">
        <div className="md:hidden text-center mb-2">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-32 bg-white/10" />
              <div className="flex items-baseline justify-center gap-1">
                <Skeleton className="h-8 w-24 bg-white/10" />
              </div>
            </div>
          ) : (
            <>
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">支付给 {orderInfo.merchant.app_name}</div>
              <div className="text-3xl font-bold text-white tracking-tight flex items-baseline justify-center gap-1">
                <span className="text-lg text-white/50 font-normal">LDC</span>
                {(parseFloat(orderInfo.order.amount)).toFixed(2)}
              </div>
            </>
          )}
        </div>

        <div className="hidden md:block mb-10 flex justify-center md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center shadow-sm backdrop-blur-sm">
              {loading ? (
                <Skeleton className="w-5 h-5 rounded-full bg-white/20" />
              ) : (
                <ShoppingBag className="size-4 text-white/80" />
              )}
            </div>
            {loading ? (
              <Skeleton className="h-5 w-24 bg-white/10" />
            ) : (
              <span className="text-xs font-bold text-white/60">订单摘要</span>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          {loading ? <LoadingSkeleton /> : <OrderContent orderInfo={orderInfo} />}
        </div>

        {!loading && (
          <div className="md:hidden text-center">
            <div className="inline-flex items-center gap-1 text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-full">
              <span>{orderInfo.order.order_name}</span>
            </div>
          </div>
        )}

        <div className="hidden md:block mt-auto pt-8">
          <div className="text-[10px] text-white/20 font-mono">
            ODR: {orderInfo?.order?.order_no || 'LOADING...'}
          </div>
        </div>
      </div>
    </div>
  )
}
