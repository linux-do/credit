"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionService } from "@/lib/services"
import type { Order } from "@/lib/services"
import { TransactionTableList } from "@/components/common/general/table-data"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const DISPUTE_PAGE_SIZE = 20

/**
 * 服务争议对话框模式
 */
type DisputeDialogMode = 'pending' | 'my-disputes'

/**
 * 服务争议对话框属性
 */
interface DisputeDialogProps {
  /** 对话框模式 */
  mode: DisputeDialogMode
  /** 是否打开 */
  open: boolean
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void
}

/**
 * 争议对话框组件
 * 支持两种模式：待处理的服务争议（服务提供者）和我发起的服务争议（积分消费者）
 */
export function DisputeDialog({ mode, open, onOpenChange }: DisputeDialogProps) {
  const [disputes, setDisputes] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)


  const fetchDisputes = useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      let result
      let filteredOrders: Order[] = []

      if (mode === 'pending') {
        result = await TransactionService.getTransactions({
          page,
          page_size: DISPUTE_PAGE_SIZE,
          type: 'receive',
          status: 'disputing'
        })
        filteredOrders = result.orders
      } else {
        const paymentResult = await TransactionService.getTransactions({
          page,
          page_size: Math.ceil(DISPUTE_PAGE_SIZE / 2),
          type: 'payment'
        })

        const onlineResult = await TransactionService.getTransactions({
          page,
          page_size: Math.ceil(DISPUTE_PAGE_SIZE / 2),
          type: 'online'
        })

        const allOrders = [...paymentResult.orders, ...onlineResult.orders]
        filteredOrders = allOrders.filter((order: Order) =>
          order.status === 'disputing' || order.status === 'refused' || order.status === 'refund'
        )

        filteredOrders.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        const startIndex = (page - 1) * DISPUTE_PAGE_SIZE
        filteredOrders = filteredOrders.slice(startIndex, startIndex + DISPUTE_PAGE_SIZE)

        result = {
          orders: filteredOrders,
          total: allOrders.filter((order: Order) =>
            order.status === 'disputing' || order.status === 'refused' || order.status === 'refund'
          ).length,
          page,
          page_size: DISPUTE_PAGE_SIZE
        }
      }

      // 总是替换数据，不累加
      setDisputes(filteredOrders)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast.error('获取争议数据失败', {
        description: error.message || '无法加载争议列表'
      })
    } finally {
      setLoading(false)
    }
  }, [mode])

  React.useEffect(() => {
    if (open) {
      fetchDisputes(1)
    } else {
      setDisputes([])
      setError(null)
    }
  }, [open, fetchDisputes])

  const handleRetry = () => {
    fetchDisputes(1)
  }

  const dialogTitle = mode === 'pending' ? '待处理的争议' : '我发起的争议'
  const dialogDescription = mode === 'pending'
    ? '您作为服务提供者，需要处理所有争议中的活动'
    : '您作为积分消费者发起的所有争议'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <TransactionTableList
            loading={loading}
            error={error}
            transactions={disputes}
            onRetry={handleRetry}
            emptyIcon={AlertTriangle}
            emptyDescription={mode === 'pending' ? '暂无待处理的争议' : '暂无您发起的争议'}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
