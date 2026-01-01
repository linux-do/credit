"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Layers, Play, Clock, Info } from "lucide-react"

import { TaskMeta, AdminService, DispatchTaskRequest } from "@/lib/services"
import { ErrorInline } from "@/components/layout/error"
import { LoadingStateWithBorder } from "@/components/layout/loading"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const TASK_CONFIGS: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, gradient: string }> = {
  'order_sync': {
    icon: Layers,
    color: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-500",
  },
  'user_gamification': {
    icon: Play,
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/50 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-500",
  },
  'dispute_auto_refund': {
    icon: Clock,
    color: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent border-rose-200/50 dark:border-rose-800/50 hover:border-rose-400 dark:hover:border-rose-500",
  }
}

const DEFAULT_TASK_CONFIG = {
  icon: Layers,
  color: "text-zinc-600 dark:text-zinc-400",
  gradient: "from-zinc-500/10 via-zinc-500/5 to-transparent border-zinc-200/50 dark:border-zinc-800/50 hover:border-zinc-400 dark:hover:border-zinc-500",
}

function DatePickerWithTime({ date, setDate }: { date: Date | undefined, setDate: (date: Date | undefined) => void }) {
  const timeString = date ? format(date, "HH:mm:ss") : ""

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined)
      return
    }

    const updated = new Date(newDate)

    if (date) {
      updated.setHours(date.getHours())
      updated.setMinutes(date.getMinutes())
      updated.setSeconds(date.getSeconds())
    } else {
      updated.setHours(0, 0, 0, 0)
    }

    setDate(updated)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    if (!newTime) return

    if (date) {
      const [hours, minutes, seconds] = newTime.split(':').map(Number)
      const updated = new Date(date)
      updated.setHours(hours || 0)
      updated.setMinutes(minutes || 0)
      updated.setSeconds(seconds || 0)
      setDate(updated)
    } else {
      const today = new Date()
      const [hours, minutes, seconds] = newTime.split(':').map(Number)
      today.setHours(hours || 0)
      today.setMinutes(minutes || 0)
      today.setSeconds(seconds || 0)
      setDate(today)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal text-xs h-8",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 size-3" />
              {date ? format(date, "yyyy-MM-dd") : <span>选择日期</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              locale={zhCN}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="w-[120px]">
        <Input
          type="time"
          step="1"
          value={timeString}
          onChange={handleTimeChange}
          className="text-xs font-mono"
        />
      </div>
    </div>
  )
}

export function TaskManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [taskTypes, setTaskTypes] = useState<TaskMeta[]>([])

  const [dispatching, setDispatching] = useState(false)
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [startTime, setStartTime] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState<Date | undefined>(undefined)
  const [userId, setUserId] = useState("")

  const fetchTaskTypes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await AdminService.getTaskTypes()
      setTaskTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载任务类型失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTaskTypes()
  }, [fetchTaskTypes])

  const handleDispatch = async () => {
    if (!selectedTaskType) return

    try {
      setDispatching(true)

      const targetTask = taskTypes.find(t => t.type === selectedTaskType)

      const params: DispatchTaskRequest = {
        task_type: selectedTaskType
      }

      if (targetTask?.type === 'order_sync') {
        if (startTime) params.start_time = startTime.toISOString()
        if (endTime) params.end_time = endTime.toISOString()
      }

      if (targetTask?.type === 'user_gamification') {
        if (userId) params.user_id = userId
      }

      await AdminService.dispatchTask(params)

      toast.success('任务下发成功', {
        description: `已成功将任务 ${ targetTask?.name || selectedTaskType } 加入队列`
      })
      setDialogOpen(false)

      setStartTime(undefined)
      setEndTime(undefined)
      setUserId("")
    } catch (err) {
      toast.error('任务下发失败', {
        description: err instanceof Error ? err.message : '未知错误'
      })
    } finally {
      setDispatching(false)
    }
  }

  const openDispatchDialog = (type: string) => {
    setSelectedTaskType(type)
    setDialogOpen(true)
  }

  const getSelectedTaskMeta = () => {
    return taskTypes.find(t => t.type === selectedTaskType)
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold tracking-tight">任务管理</div>
        </div>
      </div>

      <div className="space-y-6">
        {error ? (
          <div className="p-8 border border-dashed rounded-xl bg-card">
            <ErrorInline error={error} onRetry={fetchTaskTypes} className="justify-center" />
          </div>
        ) : loading && taskTypes.length === 0 ? (
          <LoadingStateWithBorder icon={Layers} description="加载任务类型中..." />
        ) : taskTypes.length === 0 ? (
          <EmptyStateWithBorder icon={Layers} description="暂无可用任务类型" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {taskTypes.map((task, index) => {
              const config = TASK_CONFIGS[task.type] || DEFAULT_TASK_CONFIG

              return (
                <div
                  key={`${ task.type }-${ index }`}
                  className={cn(
                    "relative group overflow-hidden rounded-xl border bg-gradient-to-br transition-all duration-500",
                    config.gradient
                  )}
                >
                  <div className="relative h-full bg-card/40 backdrop-blur-sm p-4 flex flex-col justify-between hover:bg-card/0 transition-colors duration-500">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-base tracking-tight">{task.name}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[36px]">
                            {task.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="font-mono text-[10px] bg-background/50 backdrop-blur-md border px-1.5 h-5">
                          {task.queue}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[9px] h-4.5 bg-background/50 font-mono text-muted-foreground border-border/50 px-1">
                          类型：{task.type}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] h-4.5 bg-background/50 font-mono text-muted-foreground border-border/50 px-1">
                          重试：{task.max_retry}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 mt-1">
                      <Button
                        className="w-full h-7 text-xs"
                        variant="secondary"
                        onClick={() => openDispatchDialog(task.type)}
                      >
                        <Play className="size-3 mr-1" />
                        立即执行
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>下发任务</DialogTitle>
            <DialogDescription>
              配置任务参数并启动，任务将在后台异步执行。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>执行任务</Label>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                {(() => {
                  const meta = getSelectedTaskMeta()
                  if (!meta) return null
                  const config = TASK_CONFIGS[meta.type] || DEFAULT_TASK_CONFIG
                  const Icon = config.icon
                  return (
                    <>
                      <div className={cn("p-2", config.color)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{meta.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{meta.type}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {selectedTaskType === 'order_sync' && (
              <>
                <div className="grid gap-2">
                  <Label>开始时间</Label>
                  <DatePickerWithTime date={startTime} setDate={setStartTime} />
                  <p className="text-xs text-muted-foreground">选择同步的起始时间点</p>
                </div>
                <div className="grid gap-2">
                  <Label>结束时间</Label>
                  <DatePickerWithTime date={endTime} setDate={setEndTime} />
                  <p className="text-xs text-muted-foreground">选择同步的结束时间点</p>
                </div>
              </>
            )}

            {selectedTaskType === 'user_gamification' && (
              <div className="grid gap-2">
                <Label htmlFor="user-id">用户 ID</Label>
                <Input
                  id="user-id"
                  type="number"
                  placeholder="e.g. 10086"
                  className="font-mono text-xs"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">指定需要更新积分数据的用户 ID</p>
              </div>
            )}

            {!['order_sync', 'user_gamification'].includes(selectedTaskType || '') && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-dashed">
                <Info className="h-4 w-4" />
                <span>此任务无需额外配置参数，确认后将直接下发。</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={dispatching} className="h-8 text-xs">
              取消
            </Button>
            <Button onClick={handleDispatch} disabled={dispatching} className="h-8 text-xs">
              {dispatching ? <Spinner className="size-3" /> : <Play className="size-3" />}
              {dispatching ? '下发中' : '启动'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
