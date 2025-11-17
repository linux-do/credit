"use client"

import * as React from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ErrorInline } from "@/components/layout/error"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, ListRestart, Layers } from "lucide-react"

import type { UserPayConfig } from "@/lib/services"
import { useAdmin, useTableInteraction } from "@/contexts/admin-context"


/**
 * 支付配置详情面板组件
 * 显示支付配置的详细信息和编辑面板
 * 
 * @example
 * ```tsx
 * <PayConfigDetailPanel
 *   config={config}
 *   editData={editData}
 *   onEditDataChange={onEditDataChange}
 *   onSave={onSave}
 *   saving={saving}
 * />
 * ```
 * @param {UserPayConfig} config - 支付配置
 * @param {Partial<UserPayConfig>} editData - 编辑数据
 * @param {function} onEditDataChange - 编辑数据改变回调
 * @param {function} onSave - 保存回调
 * @param {boolean} saving - 是否正在保存
 * @returns {React.ReactNode} 支付配置详情面板组件
 */
function PayConfigDetailPanel({
  config,
  editData,
  onEditDataChange,
  onSave,
  saving
}: {
  config: UserPayConfig | null
  editData: Partial<UserPayConfig>
  onEditDataChange: (field: keyof UserPayConfig, value: UserPayConfig[keyof UserPayConfig]) => void
  onSave: () => void
  saving: boolean
}) {
  /* 格式化日期 */
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!config) {
    return (
      <div className="space-y-4">
      <div className="font-semibold mb-4">配置信息</div>
        <EmptyStateWithBorder 
          icon={Layers}
          description="请选择配置查看详情"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sticky top-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">配置信息</div>
          {config && (
            <Button
              onClick={onSave}
              disabled={saving}
              size="sm"
              className="px-3 h-7 text-xs"
            >
              {saving ? (<><Spinner /> 更新中</>) : '更新'}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-0">
          <div className="border border-dashed rounded-l-lg">
          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">配置等级</label>
              <p className="text-xs text-muted-foreground">Level {config?.level}</p>
          </div>

          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">配置ID</label>
              <p className="text-xs text-muted-foreground">{config?.id}</p>
          </div>

          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
              <label className="text-xs font-medium text-muted-foreground">创建时间</label>
              <p className="text-xs text-muted-foreground">{config ? formatDate(config.created_at) : ''}</p>
          </div>

            <div className="px-3 py-2 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">更新时间</label>
              <p className="text-xs text-muted-foreground">{config ? formatDate(config.updated_at) : ''}</p>
            </div>
          </div>

          <div className="border border-dashed rounded-r-lg border-l-0">
          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
              <label className="text-xs font-medium text-muted-foreground">最低分数</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={editData.min_score !== undefined ? editData.min_score.toString() : (config?.min_score?.toString() || '')}
                  placeholder={editData.min_score === undefined && !config?.min_score ? '必需' : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      onEditDataChange('min_score', 0)
                      return
                    }

                    const numValue = parseInt(value)
                    if (isNaN(numValue)) {
                      return
                    }

                    if (numValue >= 0) {
                      onEditDataChange('min_score', numValue)
                    }
                  }}
                  className="text-xs text-right h-4 w-16 px-0 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[12px]"
                />
                <p className="text-xs text-muted-foreground">LDC</p>
              </div>
          </div>

          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
              <label className="text-xs font-medium text-muted-foreground">最高分数</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={editData.max_score !== undefined ? (editData.max_score?.toString() || '') : (config?.max_score?.toString() || '')}
                  placeholder={(editData.max_score === null || editData.max_score === undefined) && (config?.max_score === null || config?.max_score === undefined) ? '无限制' : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      onEditDataChange('max_score', null)
                      return
                    }

                    const numValue = parseInt(value)
                    if (isNaN(numValue)) {
                      return
                    }

                    if (numValue >= 0) {
                      onEditDataChange('max_score', numValue)
                    }
                  }}
                  className="text-xs text-right h-4 w-16 px-0 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[12px]"
                />
                <p className="text-xs text-muted-foreground">LDC</p>
              </div>
          </div>

          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
              <label className="text-xs font-medium text-muted-foreground">手续费率</label>
              <div className="flex items-right gap-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={
                    editData.fee_rate !== undefined
                      ? (parseFloat(editData.fee_rate.toString()) * 100).toString()
                      : (config?.fee_rate ? (parseFloat(config.fee_rate.toString()) * 100).toString() : '')
                  }
                  placeholder={editData.fee_rate === undefined && !config?.fee_rate ? '必需' : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      onEditDataChange('fee_rate', '0')
                      return
                    }

                    const numValue = parseInt(value)
                    if (isNaN(numValue)) {
                      return // 无效数字，忽略
                    }

                    if (numValue >= 0 && numValue <= 100) {
                      onEditDataChange('fee_rate', (numValue / 100).toString())
                    }
                  }}
                  className="text-xs text-right h-4 w-16 px-0 mr-3 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[12px]"
                />
                <p className="text-xs text-muted-foreground">%</p>
              </div>
          </div>

          <div className="px-3 py-2 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">每日支付上限</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={editData.daily_limit !== undefined ? (editData.daily_limit?.toString() || '') : (config?.daily_limit?.toString() || '')}
                  placeholder={(editData.daily_limit === null || editData.daily_limit === undefined) && (config?.daily_limit === null || config?.daily_limit === undefined) ? '无限制' : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      onEditDataChange('daily_limit', null)
                      return
                    }

                    const numValue = parseInt(value)
                    if (isNaN(numValue)) {
                      return
                    }

                    if (numValue >= 0) {
                      onEditDataChange('daily_limit', numValue)
                    }
                  }}
                  className="text-xs text-right h-4 w-16 px-0 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[12px]"
                />
                <p className="text-xs text-muted-foreground">LDC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 支付配置表格组件
 * 显示支付配置记录的表格，可复用于不同页面
 * 
 * @example
 * ```tsx
 * <UserPayConfigsTable
 *   configs={configs}
 *   onDelete={onDelete}
 *   onHover={onHover}
 *   onSelect={onSelect}
 *   hoveredConfig={hoveredConfig}
 *   selectedConfig={selectedConfig}
 * />
 * ```
 * @param {UserPayConfig[]} configs - 支付配置列表
 * @param {function} onDelete - 删除回调
 * @param {function} onHover - 悬停回调
 * @param {function} onSelect - 选择回调
 * @param {UserPayConfig | null} hoveredConfig - 悬停配置
 * @param {UserPayConfig | null} selectedConfig - 选中配置
 * @returns {React.ReactNode} 支付配置表格组件
 */
export function UserPayConfigsTable({
  configs,
  onDelete,
  onHover,
  onSelect,
  hoveredConfig,
  selectedConfig
}: {
  configs: UserPayConfig[]
  onDelete: (id: number) => void
  onHover: (config: UserPayConfig | null) => void
  onSelect: (config: UserPayConfig) => void
  hoveredConfig: UserPayConfig | null
  selectedConfig: UserPayConfig | null
}) {
  return (
    <div className="border border-dashed shadow-none rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-dashed">
              <TableHead className="whitespace-nowrap w-[80px]">等级</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[100px]">最低分数</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[100px]">最高分数</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[100px]">手续费率</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[100px]">每日支付上限</TableHead>
              <TableHead className="whitespace-nowrap text-center w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="animate-in fade-in duration-200">
            {configs.map((config) => (
              <PayConfigTableRow
                key={config.id}
                config={config}
                onDelete={onDelete}
                onHover={onHover}
                onSelect={onSelect}
                isHovered={hoveredConfig?.id === config.id}
                isSelected={selectedConfig?.id === config.id}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/**
 * 支付配置表格行组件
 * 显示支付配置表格行
 * 
 * @example
 * ```tsx
 * <PayConfigTableRow
 *   config={config}
 *   onDelete={onDelete}
 *   onHover={onHover}
 *   onSelect={onSelect}
 *   isHovered={isHovered}
 *   isSelected={isSelected}
 * />
 * ```
 * @param {UserPayConfig} config - 支付配置
 * @param {function} onDelete - 删除回调
 * @param {function} onHover - 悬停回调
 * @param {function} onSelect - 选择回调
 * @param {boolean} isHovered - 是否悬停
 * @param {boolean} isSelected - 是否选中
 * @returns {React.ReactNode} 支付配置表格行组件
 */
function PayConfigTableRow({
  config,
  onDelete,
  onHover,
  onSelect,
  isHovered,
  isSelected
}: {
  config: UserPayConfig
  onDelete: (id: number) => void
  onHover: (config: UserPayConfig | null) => void
  onSelect: (config: UserPayConfig) => void
  isHovered: boolean
  isSelected: boolean
}) {
  return (
    <TableRow
      className={`border-b border-dashed cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 hover:bg-blue-100'
          : isHovered
            ? 'bg-gray-50 hover:bg-gray-100'
            : 'hover:bg-gray-50'
      }`}
      onMouseEnter={() => onHover(config)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(config)}
    >
      <TableCell className="text-xs font-medium whitespace-nowrap py-1">
        Level {config.level}
      </TableCell>
      <TableCell className="text-xs text-center py-1">
        {config.min_score.toLocaleString()}
      </TableCell>
      <TableCell className="text-xs text-center py-1">
        {config.max_score ? config.max_score.toLocaleString() : '无限制'}
      </TableCell>
      <TableCell className="text-xs text-center py-1">
        {Math.round(parseFloat(config.fee_rate.toString()) * 100)}%
      </TableCell>
      <TableCell className="text-xs text-center py-1">
        {config.daily_limit ? config.daily_limit.toLocaleString() : '无限制'}
      </TableCell>
      <TableCell className="text-center py-1">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              删除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除 Level {config.level} 配置吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(config.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}

/**
 * 用户支付配置管理组件
 * 
 * @example
 * ```tsx
 * <UserPayConfigs />
 * ```
 * @returns {React.ReactNode} 用户支付配置管理组件
 */
export function UserPayConfigs() {
  const {
    userPayConfigs: configs,
    userPayConfigsLoading: loading,
    userPayConfigsError: error,
    refetchUserPayConfigs,
    updateUserPayConfig,
    deleteUserPayConfig,
  } = useAdmin()

  /* 悬停配置 */
  const {
    hoveredItem: hoveredConfig,
    selectedItem: selectedConfig,
    editData,
    saving,
    setSaving,
    handleHover,
    handleSelect,
    handleEditDataChange,
  } = useTableInteraction<UserPayConfig>((config) => ({
    min_score: config.min_score,
    max_score: config.max_score,
    fee_rate: config.fee_rate.toString(),
    daily_limit: config.daily_limit,
  }))

  /* 删除支付配置 */
  const handleDelete = async (id: number) => {
    try {
      await deleteUserPayConfig(id)
      toast.success('删除成功')
    } catch (error) {
      toast.error('删除失败', {
        description: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /* 保存支付配置 */
  const handleSave = async () => {
    if (!selectedConfig) return

    setSaving(true)
    try {
      await updateUserPayConfig(selectedConfig.id, {
        min_score: editData.min_score ?? selectedConfig.min_score,
        max_score: editData.max_score,
        daily_limit: editData.daily_limit,
        fee_rate: editData.fee_rate?.toString() ?? selectedConfig.fee_rate.toString(),
      })
      await refetchUserPayConfigs()
      toast.success('保存成功')
    } catch (error) {
      toast.error('保存失败', {
        description: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setSaving(false)
    }
  }

  const renderContent = () => {
    if (loading && configs.length === 0) {
      return (
        <EmptyStateWithBorder
          icon={ListRestart}
          description="配置加载中"
          loading={true}
        />
      )
    }

    if (error) {
      return (
        <div className="p-8 border-2 border-dashed border-border rounded-lg">
        <ErrorInline
          error={error}
          onRetry={() => refetchUserPayConfigs()}
          className="justify-center"
        />
        </div>
      )
    }

    if (!configs || configs.length === 0) {
      return (
        <EmptyStateWithBorder
          icon={Layers}
          description="未发现支付配置"
        />
      )
    }

    return (
      <UserPayConfigsTable
        configs={configs}
        onDelete={handleDelete}
        onHover={handleHover}
        onSelect={handleSelect}
        hoveredConfig={hoveredConfig}
        selectedConfig={selectedConfig}
      />
    )
  }

  const displayConfig = selectedConfig || hoveredConfig

  return (
    <div className="py-6">
      <div className="flex border-b border-border pb-2 mb-6">
        <div className="text-2xl font-semibold">支付配置</div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-4">
            <div className="font-semibold">配置列表</div>
          </div>
          {renderContent()}
        </div>

        <div>
          <PayConfigDetailPanel
            config={displayConfig}
            editData={editData}
            onEditDataChange={handleEditDataChange}
            onSave={handleSave}
            saving={saving}
          />
        </div>
      </div>
    </div>
  )
}
