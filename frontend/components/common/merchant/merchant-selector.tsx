import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MerchantAPIKey } from "@/lib/services"

interface MerchantSelectorProps {
  /** API Keys 列表 */
  apiKeys: MerchantAPIKey[]
  /** 选中的 API Key */
  selectedKeyId: string | null
  /** 选择回调 */
  onSelect: (id: string) => void
  /** 是否正在加载 */
  loading?: boolean
}

/**
 * 应用选择器组件
 * 用于在多个应用之间切换
 */
export function MerchantSelector({
  apiKeys,
  selectedKeyId,
  onSelect,
  loading = false,
}: MerchantSelectorProps) {
  return (
    <Select
      value={selectedKeyId || ''}
      onValueChange={(value) => onSelect(value)}
      disabled={loading || apiKeys.length === 0}
    >
      <SelectTrigger className="w-fit h-8 text-xs" size="sm">
        <SelectValue placeholder="请选择应用" />
      </SelectTrigger>
      <SelectContent>
        {apiKeys.map((apiKey) => (
          <SelectItem
            key={apiKey.id}
            value={apiKey.id}
            title={apiKey.app_description ? `${ apiKey.app_name } - ${ apiKey.app_description }` : apiKey.app_name}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">{apiKey.app_name}</span>
              {apiKey.app_description && (
                <span className="text-xs text-muted-foreground truncate">
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
