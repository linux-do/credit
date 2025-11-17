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

import type { SystemConfig } from "@/lib/services"
import { useAdmin, useTableInteraction } from "@/contexts/admin-context"


/**
 * 系统配置
 * 显示系统配置的详细信息和编辑面板
 * 
 * @example
 * ```tsx
 * <SystemConfigDetailPanel
 *   config={config}
 *   editData={editData}
 *   onEditDataChange={onEditDataChange}
 *   onSave={onSave}
 *   saving={saving}
 * />
 * ```
 * @param {SystemConfig} config - 系统配置
 * @param {Partial<SystemConfig>} editData - 编辑数据
 * @param {function} onEditDataChange - 编辑数据改变回调
 * @param {function} onSave - 保存回调
 * @param {boolean} saving - 是否正在保存
 * @returns {React.ReactNode} 系统配置详情面板组件
 */
function SystemConfigDetailPanel({
  config,
  editData,
  onEditDataChange,
  onSave,
  saving
}: {
  config: SystemConfig | null
  editData: Partial<SystemConfig>
  onEditDataChange: (field: keyof SystemConfig, value: SystemConfig[keyof SystemConfig]) => void
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
        <div className="grid grid-cols-1 gap-0">
          <div className="border border-dashed rounded-lg">
          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">配置键</label>
              <p className="text-xs text-muted-foreground font-mono">{config?.key}</p>
          </div>

          <div className="pl-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">配置值</label>
            <div className="flex gap-1 w-[90%]">
              <Input
                type="number"
                step="1"
                min="0"
                value={editData.value !== undefined ? editData.value : (config?.value || '')}
                placeholder={editData.value === undefined && !config?.value ? '必需' : ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    onEditDataChange('value', '')
                    return
                  }
                  onEditDataChange('value', value)
                }}
                className="!text-[12px] text-right h-4 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:!text-[12px] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]"
                style={{
                  MozAppearance: 'textfield'
                }}
              />
            </div>
          </div>

          <div className="pl-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">配置描述</label>
            <div className="flex gap-1 w-[90%]">
              <Input
                type="text"
                value={editData.description !== undefined ? editData.description : (config?.description || '')}
                placeholder="可选描述"
                onChange={(e) => {
                  const value = e.target.value
                  onEditDataChange('description', value)
                }}
                className="!text-[12px] text-right h-4 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:!text-[12px]"
              />
            </div>
          </div>

          <div className="px-3 py-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">创建时间</label>
            <p className="text-xs text-muted-foreground">{config ? formatDate(config.created_at) : ''}</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 系统配置表格组件
 * 显示系统配置的表格
 * 
 * @example
 * ```tsx
 * <SystemConfigsTable
 *   configs={configs}
 *   onDelete={onDelete}
 *   onHover={onHover}
 *   onSelect={onSelect}
 *   hoveredConfig={hoveredConfig}
 *   selectedConfig={selectedConfig}
 * />
 * ```
 * @param {SystemConfig[]} configs - 系统配置列表
 * @param {function} onDelete - 删除回调
 * @param {function} onHover - 悬停回调
 * @param {function} onSelect - 选择回调
 * @param {SystemConfig | null} hoveredConfig - 悬停配置
 * @param {SystemConfig | null} selectedConfig - 选中配置
 * @returns {React.ReactNode} 系统配置表格组件
 */
export function SystemConfigsTable({
  configs,
  onDelete,
  onHover,
  onSelect,
  hoveredConfig,
  selectedConfig
}: {
  configs: SystemConfig[]
  onDelete: (key: string) => void
  onHover: (config: SystemConfig | null) => void
  onSelect: (config: SystemConfig) => void
  hoveredConfig: SystemConfig | null
  selectedConfig: SystemConfig | null
}) {
  return (
    <div className="border border-dashed shadow-none rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-dashed">
              <TableHead className="whitespace-nowrap w-[200px]">配置键</TableHead>
              <TableHead className="whitespace-nowrap w-[120px]">配置值</TableHead>
              <TableHead className="whitespace-nowrap w-[200px]">描述</TableHead>
              <TableHead className="whitespace-nowrap text-center w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="animate-in fade-in duration-200">
            {configs.map((config) => (
              <SystemConfigTableRow
                key={config.key}
                config={config}
                onDelete={onDelete}
                onHover={onHover}
                onSelect={onSelect}
                isHovered={hoveredConfig?.key === config.key}
                isSelected={selectedConfig?.key === config.key}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/**
 * 系统配置表格行组件
 * 显示系统配置表格行
 * 
 * @example
 * ```tsx
 * <SystemConfigTableRow
 *   config={config}
 *   onDelete={onDelete}
 *   onHover={onHover}
 *   onSelect={onSelect}
 *   isHovered={isHovered}
 *   isSelected={isSelected}
 * />
 * ```
 * @param {SystemConfig} config - 系统配置
 * @param {function} onDelete - 删除回调
 * @param {function} onHover - 悬停回调
 * @param {function} onSelect - 选择回调
 * @param {boolean} isHovered - 是否悬停
 * @param {boolean} isSelected - 是否选中
 * @returns {React.ReactNode} 系统配置表格行组件
 */
function SystemConfigTableRow({
  config,
  onDelete,
  onHover,
  onSelect,
  isHovered,
  isSelected
}: {
  config: SystemConfig
  onDelete: (key: string) => void
  onHover: (config: SystemConfig | null) => void
  onSelect: (config: SystemConfig) => void
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
      <TableCell className="text-xs font-medium whitespace-nowrap py-1 font-mono">
        {config.key}
      </TableCell>
      <TableCell className="text-xs py-1 max-w-[300px] truncate">
        {config.value}
      </TableCell>
      <TableCell className="text-xs py-1 text-muted-foreground max-w-[200px] truncate">
        {config.description || '暂无描述'}
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
                确定要删除配置项 <span className="font-semibold font-mono">{config.key}</span> 吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(config.key)}
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
 * 系统配置管理组件
 * 
 * @example
 * ```tsx
 * <SystemConfigs />
 * ```
 * @returns {React.ReactNode} 系统配置管理组件
 */
export function SystemConfigs() {
  const {
    systemConfigs: configs,
    systemConfigsLoading: loading,
    systemConfigsError: error,
    refetchSystemConfigs,
    updateSystemConfig,
    deleteSystemConfig,
  } = useAdmin()

  const {
    hoveredItem: hoveredConfig,
    selectedItem: selectedConfig,
    editData,
    saving,
    setSaving,
    handleHover,
    handleSelect,
    handleEditDataChange,
  } = useTableInteraction<SystemConfig>((config) => ({
    value: config.value,
    description: config.description,
  }))

  /* 删除系统配置 */
  const handleDelete = async (key: string) => {
    try {
      await deleteSystemConfig(key)
      toast.success('删除成功')
    } catch (error) {
      toast.error('删除失败', {
        description: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /* 保存系统配置 */
  const handleSave = async () => {
    if (!selectedConfig) return

    setSaving(true)
    try {
      await updateSystemConfig(selectedConfig.key, {
        value: editData.value || '',
        description: editData.description,
      })
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
            onRetry={() => refetchSystemConfigs()}
            className="justify-center"
          />
        </div>
      )
    }

    if (!configs || configs.length === 0) {
      return (
        <EmptyStateWithBorder
          icon={Layers}
          description="未发现系统配置"
        />
      )
    }

    return (
      <SystemConfigsTable
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
        <div className="text-2xl font-semibold">系统配置</div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-4">
            <div className="font-semibold">配置列表</div>
          </div>
          {renderContent()}
        </div>

        <div>
          <SystemConfigDetailPanel
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
