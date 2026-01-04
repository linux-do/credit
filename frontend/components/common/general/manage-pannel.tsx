import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorInline } from "@/components/layout/error";
import { EmptyStateWithBorder } from "@/components/layout/empty";
import { LoadingStateWithBorder } from "@/components/layout/loading";
import { ListRestart, Layers, LucideIcon, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ManagePageProps<T> {
  title: string;
  data: T[];
  loading: boolean;
  error: Error | null;
  onReload: () => void;

  /** 获取初始编辑数据 */
  getInitialEditData: (item: T) => Partial<T>;
  onSave: (item: T, editData: Partial<T>) => Promise<void>;
  onDelete: (item: T) => Promise<void>;

  /** 渲染表格 (Config-Driven) */
  columns: {
    header: string;
    cell: (item: T) => React.ReactNode;
    width?: string;
    align?: "left" | "center" | "right";
    className?: string;
  }[];

  /** 渲染详情 */
  renderDetail: (props: {
    selected: T | null;
    hovered: T | null;
    editData: Partial<T>;
    onEditDataChange: (field: keyof T, value: T[keyof T]) => void;
    onSave: () => void;
    saving: boolean;
  }) => React.ReactNode;

  /** 空状态图标 */
  emptyIcon?: LucideIcon;
  emptyDescription?: string;
  loadingDescription?: string;
  getId: (item: T) => string | number;
}

export function ManagePage<T>({
  title,
  data,
  loading,
  error,
  onReload,
  getInitialEditData,
  onSave,
  onDelete,
  columns,
  renderDetail,
  emptyIcon = Layers,
  emptyDescription = "暂无数据",
  loadingDescription = "加载中",
  getId,
}: ManagePageProps<T>) {
  /** 悬停状态 */
  const [hoveredItem, setHoveredItem] = useState<T | null>(null);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [editData, setEditData] = useState<Partial<T>>({});
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);

  /** 悬停处理 */
  const handleHover = (item: T | null) => {
    setHoveredItem(item);
  };

  /** 选择处理 */
  const handleSelect = (item: T) => {
    const itemId = getId(item);
    const selectedId = selectedItem ? getId(selectedItem) : null;

    if (itemId === selectedId) {
      setSelectedItem(null);
      setEditData({});
    } else {
      setSelectedItem(item);
      setEditData(getInitialEditData(item));
    }
    setHoveredItem(null);
  };

  /** 编辑数据处理 */
  const handleEditDataChange = (field: keyof T, value: T[keyof T]) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /** 保存处理 */
  const handleSave = async () => {
    if (!selectedItem) return;

    try {
      setSaving(true);
      await onSave(selectedItem, editData);
      toast.success("保存成功");
    } catch (error) {
      toast.error("保存失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setSaving(false);
    }
  };

  /** 删除处理 */
  const handleDeleteClick = (item: T) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await onDelete(deletingItem);
      toast.success("删除成功");
      setDeletingItem(null);
      // 如果删除的是当前选中的项，清除选中状态
      if (selectedItem && getId(selectedItem) === getId(deletingItem)) {
        setSelectedItem(null);
        setEditData({});
      }
    } catch (error) {
      toast.error("删除失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  /** 渲染内容 */
  const renderContent = () => {
    if (loading && (!data || data.length === 0)) {
      return (
        <LoadingStateWithBorder
          icon={ListRestart}
          description={loadingDescription}
        />
      );
    }

    if (error) {
      return (
        <div className="p-8 border border-dashed rounded-lg">
          <ErrorInline
            error={error}
            onRetry={onReload}
            className="justify-center"
          />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <EmptyStateWithBorder icon={emptyIcon} description={emptyDescription} />
      );
    }

    return (
      <ManageTable
        data={data}
        columns={columns}
        selected={selectedItem}
        hovered={hoveredItem}
        onSelect={handleSelect}
        onHover={handleHover}
        onDelete={handleDeleteClick}
        getId={getId}
      />
    );
  };

  return (
    <div className="py-6">
      <div className="flex border-b border-border pb-2 mb-6">
        <div className="text-2xl font-semibold">{title}</div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-4">
            <div className="font-semibold">配置列表</div>
          </div>
          {renderContent()}
        </div>

        <div>
          {renderDetail({
            selected: selectedItem,
            hovered: hoveredItem,
            editData,
            onEditDataChange: handleEditDataChange,
            onSave: handleSave,
            saving,
          })}
        </div>
      </div>

      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该配置。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** 详情面板 props */
interface ManageDetailPanelProps {
  title?: string;
  isEmpty: boolean;
  emptyDescription?: string;
  onSave?: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

/** 详情面板 */
export function ManageDetailPanel({
  title = "配置信息",
  isEmpty,
  emptyDescription = "请选择配置查看详情",
  onSave,
  saving = false,
  children,
}: ManageDetailPanelProps) {
  if (isEmpty) {
    return (
      <div className="space-y-4">
        <div className="font-semibold mb-4">{title}</div>
        <EmptyStateWithBorder icon={Layers} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sticky top-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">{title}</div>
          {onSave && (
            <Button
              onClick={onSave}
              disabled={saving}
              size="sm"
              className="px-3 h-7 text-xs"
            >
              {saving ? (
                <>
                  <Spinner /> 更新中
                </>
              ) : (
                "更新"
              )}
            </Button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/** 表格面板 */
export function ManageTable<T>({
  data,
  columns,
  selected,
  hovered,
  onSelect,
  onHover,
  onDelete,
  getId,
}: {
  data: T[];
  columns: {
    header: string;
    cell: (item: T) => React.ReactNode;
    width?: string;
    align?: "left" | "center" | "right";
    className?: string;
  }[];
  selected: T | null;
  hovered: T | null;
  onSelect: (item: T) => void;
  onHover: (item: T | null) => void;
  onDelete: (item: T) => void;
  getId: (item: T) => string | number;
}) {
  return (
    <div className="border border-dashed shadow-none rounded-lg overflow-hidden">
      <ScrollArea className="w-full">
        <div className="relative w-full">
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              <TableRow className="border-b border-dashed">
                {columns.map((col, index) => (
                  <TableHead
                    key={index}
                    className={`whitespace-nowrap ${col.width ? `w-[${col.width}]` : ""} ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""} ${col.className || ""}`}
                  >
                    {col.header}
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap text-center w-[120px]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="animate-in fade-in duration-200">
              {data.map((item) => {
                const id = getId(item);
                const isSelected = selected && getId(selected) === id;
                const isHovered = hovered && getId(hovered) === id;

                return (
                  <TableRow
                    key={id}
                    className={`border-b border-dashed cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/5 hover:bg-primary/10"
                        : isHovered
                          ? "bg-gray-100 hover:bg-muted/50"
                          : "hover:bg-gray-100"
                    }`}
                    onMouseEnter={() => onHover(item)}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onSelect(item)}
                  >
                    {columns.map((col, index) => (
                      <TableCell
                        key={index}
                        className={`text-xs py-1 ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""} ${col.className || ""}`}
                      >
                        {col.cell(item)}
                      </TableCell>
                    ))}
                    <TableCell className="text-xs py-1 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
