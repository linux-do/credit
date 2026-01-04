"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  ManagePage,
  ManageDetailPanel,
} from "@/components/common/general/manage-pannel";

import { formatDateTime } from "@/lib/utils";
import type { SystemConfig } from "@/lib/services";
import { useAdmin } from "@/contexts/admin-context";

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
  saving,
}: {
  config: SystemConfig | null;
  editData: Partial<SystemConfig>;
  onEditDataChange: (
    field: keyof SystemConfig,
    value: SystemConfig[keyof SystemConfig]
  ) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <ManageDetailPanel isEmpty={!config} onSave={onSave} saving={saving}>
      <div className="grid grid-cols-1 gap-0">
        <div className="border border-dashed rounded-lg">
          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">
              配置键
            </label>
            <p className="text-xs text-muted-foreground font-mono">
              {config?.key}
            </p>
          </div>

          <div className="pl-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">
              配置值
            </label>
            <div className="flex gap-1 w-[90%]">
              <Input
                type="number"
                step="1"
                min="0"
                value={
                  editData.value !== undefined
                    ? editData.value
                    : config?.value || ""
                }
                placeholder={
                  editData.value === undefined && !config?.value ? "必需" : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    onEditDataChange("value", "");
                    return;
                  }
                  onEditDataChange("value", value);
                }}
                className="!text-[12px] text-right h-4 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:!text-[12px] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]"
                style={{
                  MozAppearance: "textfield",
                }}
              />
            </div>
          </div>

          <div className="pl-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">
              配置描述
            </label>
            <div className="flex gap-1 w-[90%]">
              <Input
                type="text"
                value={
                  editData.description !== undefined
                    ? editData.description
                    : config?.description || ""
                }
                placeholder="可选描述"
                onChange={(e) => {
                  const value = e.target.value;
                  onEditDataChange("description", value);
                }}
                className="!text-[12px] text-right h-4 rounded-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:!text-[12px]"
              />
            </div>
          </div>

          <div className="px-3 py-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              创建时间
            </label>
            <p className="text-xs text-muted-foreground">
              {config ? formatDateTime(config.created_at) : ""}
            </p>
          </div>
        </div>
      </div>
    </ManageDetailPanel>
  );
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
  } = useAdmin();

  const getInitialEditData = (config: SystemConfig) => ({
    value: config.value,
    description: config.description,
  });

  const handleSave = async (
    config: SystemConfig,
    editData: Partial<SystemConfig>
  ) => {
    if (!config) return;

    await updateSystemConfig(config.key, {
      value: editData.value ?? config.value,
      description: editData.description ?? config.description,
    });
    await refetchSystemConfigs();
  };

  const handleDelete = async (config: SystemConfig) => {
    await deleteSystemConfig(config.key);
  };

  return (
    <ManagePage<SystemConfig>
      title="系统配置"
      data={configs}
      loading={loading}
      error={error}
      onReload={refetchSystemConfigs}
      getInitialEditData={getInitialEditData}
      onSave={handleSave}
      onDelete={handleDelete}
      getId={(config) => config.key}
      emptyDescription="未发现系统配置"
      loadingDescription="配置加载中"
      columns={[
        {
          header: "配置键",
          cell: (item) => (
            <span className="font-mono font-medium">{item.key}</span>
          ),
          width: "200px",
        },
        {
          header: "配置值",
          cell: (item) => (
            <span
              className="truncate max-w-[120px] inline-block"
              title={item.value}
            >
              {item.value}
            </span>
          ),
          width: "120px",
        },
        {
          header: "描述",
          cell: (item) => (
            <span
              className="truncate max-w-[200px] inline-block text-muted-foreground"
              title={item.description}
            >
              {item.description}
            </span>
          ),
          width: "200px",
        },
      ]}
      renderDetail={({
        selected,
        hovered,
        editData,
        onEditDataChange,
        onSave,
        saving,
      }) => (
        <SystemConfigDetailPanel
          config={selected || hovered}
          editData={editData}
          onEditDataChange={onEditDataChange}
          onSave={onSave}
          saving={saving}
        />
      )}
    />
  );
}
