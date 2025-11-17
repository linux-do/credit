import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { MerchantAPIKey } from "@/lib/services"


interface MerchantSelectorProps {
  /** API Keys 列表 */
  apiKeys: MerchantAPIKey[]
  /** 选中的 API Key */
  selectedKeyId: number | null
  /** 选择回调 */
  onSelect: (id: number) => void
  /** 是否正在加载 */
  loading?: boolean
}

/**
 * 商户选择器组件
 * 用于在多个商户应用之间切换
 */
export function MerchantSelector({
  apiKeys,
  selectedKeyId,
  onSelect,
  loading = false,
}: MerchantSelectorProps) {
  return (
      <Select
        value={selectedKeyId?.toString()}
        onValueChange={(value) => onSelect(Number(value))}
        disabled={loading || apiKeys.length === 0}
      >
        <SelectTrigger className="w-fit text-xs shadow-none" size="sm">
          <SelectValue placeholder="请选择商户应用" />
        </SelectTrigger>
        <SelectContent>
          {apiKeys.map((apiKey) => (
            <SelectItem key={apiKey.id} value={apiKey.id.toString()}>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">{apiKey.app_name}</span>
                {apiKey.app_description && (
                  <span className="text-xs text-muted-foreground">
                    - {apiKey.app_description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
  )
}
