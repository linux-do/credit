"use client"

import * as React from "react"
import { ManagePage, ManageDetailPanel } from "@/components/common/general/manage-pannel"
import { Input } from "@/components/ui/input"

import { formatDateTime } from "@/lib/utils"
import type { UserPayConfig } from "@/lib/services"
import { useAdmin } from "@/contexts/admin-context"


/**
 * 积分配置详情面板组件
 * 显示积分配置的详细信息和编辑面板
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
 * @param {UserPayConfig} config - 积分配置
 * @param {Partial<UserPayConfig>} editData - 编辑数据
 * @param {function} onEditDataChange - 编辑数据改变回调
 * @param {function} onSave - 保存回调
 * @param {boolean} saving - 是否正在保存
 * @returns {React.ReactNode} 积分配置详情面板组件
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


  return (
    <ManageDetailPanel
      isEmpty={!config}
      onSave={onSave}
      saving={saving}
    >
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
            <p className="text-xs text-muted-foreground">{config ? formatDateTime(config.created_at) : ''}</p>
          </div>

          <div className="px-3 py-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">更新时间</label>
            <p className="text-xs text-muted-foreground">{config ? formatDateTime(config.updated_at) : ''}</p>
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
                    return
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

          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">分数转化率</label>
            <div className="flex items-right gap-1">
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={
                  editData.score_rate !== undefined
                    ? (parseFloat(editData.score_rate.toString()) * 100).toString()
                    : (config?.score_rate ? (parseFloat(config.score_rate.toString()) * 100).toString() : '')
                }
                placeholder={editData.score_rate === undefined && !config?.score_rate ? '必需' : ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    onEditDataChange('score_rate', '0')
                    return
                  }

                  const numValue = parseInt(value)
                  if (isNaN(numValue)) {
                    return
                  }

                  if (numValue >= 0 && numValue <= 100) {
                    onEditDataChange('score_rate', (numValue / 100).toString())
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
    </ManageDetailPanel>
  )
}





/**
 * 用户积分配置管理组件
 * 
 * @example
 * ```tsx
 * <UserPayConfigs />
 * ```
 * @returns {React.ReactNode} 用户积分配置管理组件
 */
export function UserPayConfigs() {
  const {
    userPayConfigs: configs,
    userPayConfigsLoading: loading,
    userPayConfigsError: error,
    refetchUserPayConfigs,
    updateUserPayConfig,
    deleteUserPayConfig
  } = useAdmin()

  const getInitialEditData = (config: UserPayConfig) => ({
    min_score: config.min_score,
    max_score: config.max_score,
    daily_limit: config.daily_limit,
    fee_rate: config.fee_rate.toString(),
    score_rate: config.score_rate.toString(),
    distribute_rate: config.distribute_rate.toString(),
  })

  const handleSave = async (config: UserPayConfig, editData: Partial<UserPayConfig>) => {
    if (!config) return

    await updateUserPayConfig(config.id, {
      min_score: editData.min_score ?? config.min_score,
      max_score: editData.max_score,
      daily_limit: editData.daily_limit,
      fee_rate: editData.fee_rate?.toString() ?? config.fee_rate.toString(),
      score_rate: editData.score_rate?.toString() ?? config.score_rate.toString(),
      distribute_rate: editData.distribute_rate?.toString() ?? config.distribute_rate.toString(),
    })
    await refetchUserPayConfigs()
  }

  const handleDelete = async (config: UserPayConfig) => {
    await deleteUserPayConfig(config.id)
  }

  return (
    <ManagePage<UserPayConfig>
      title="积分配置"
      data={configs}
      loading={loading}
      error={error}
      onReload={refetchUserPayConfigs}
      getInitialEditData={getInitialEditData}
      onSave={handleSave}
      onDelete={handleDelete}
      getId={(config) => config.id}
      emptyDescription="未发现积分配置"
      loadingDescription="配置加载中"
      columns={[
        { header: "等级", cell: (item) => <span className="font-medium">Level {item.level}</span>, width: "min-w-[80px]", align: "left" },
        { header: "最低分", cell: (item) => item.min_score, width: "min-w-[200px]", align: "left" },
        { header: "最高分", cell: (item) => item.max_score || "无限制", width: "min-w-[200px]", align: "left" },
        { header: "每日限额", cell: (item) => item.daily_limit ? `LDC ${ item.daily_limit.toLocaleString() }` : "无限制", width: "min-w-[200px]", align: "left" },
        { header: "费率", cell: (item) => `${ (Number(item.fee_rate) * 100).toFixed(2) }%`, width: "min-w-[200px]", align: "left" },
        { header: "分数转化率", cell: (item) => `${ (Number(item.score_rate) * 100).toFixed(2) }%`, width: "min-w-[200px]", align: "left" },
        { header: "更新时间", cell: (item) => <span className="text-muted-foreground">{formatDateTime(item.updated_at)}</span>, width: "min-w-[200px]", align: "left" },
      ]}
      renderDetail={({ selected, hovered, editData, onEditDataChange, onSave, saving }) => (
        <PayConfigDetailPanel
          config={selected || hovered}
          editData={editData}
          onEditDataChange={onEditDataChange}
          onSave={onSave}
          saving={saving}
        />
      )}
    />
  )
}
