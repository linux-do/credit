"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetTitle, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Layers, Search, UserX, UserCheck, Eye, Wallet, CreditCard, ShieldCheck, Filter, X, ChevronDown, ChevronLeft, ChevronRight, Users, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { AdminUser, AdminService, DispatchTaskRequest } from "@/lib/services"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { LoadingStateWithBorder } from "@/components/layout/loading"
import { ErrorInline } from "@/components/layout/error"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAdminUsers } from "@/contexts/admin-users-context"

export function UsersManager() {
  const {
    users,
    total,
    loading,
    error,
    page,
    pageSize,
    searchUsername,
    statusFilter,
    setPage,
    setPageSize,
    setSearchUsername,
    setStatusFilter,
    fetchUsers,
    updateUserStatus
  } = useAdminUsers()

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleStatusToggle = async (user: AdminUser) => {
    await updateUserStatus(user)

    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
    }
  }

  const handleShowDetail = (user: AdminUser) => {
    setSelectedUser(user)
    setDetailOpen(true)
  }

  const handleUpdateCredits = async (user: AdminUser) => {
    try {
      setUpdatingUserId(user.id)
      const params: DispatchTaskRequest = {
        task_type: 'user_gamification',
        user_id: user.id
      }
      await AdminService.dispatchTask(params)
      toast.success('积分更新任务已下发', {
        description: `正在更新用户 ${ user.username } 的积分数据`
      })
    } catch (err) {
      toast.error('任务下发失败', {
        description: err instanceof Error ? err.message : '未知错误'
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const renderFilterBar = () => (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-5 border-dashed text-[10px] font-medium shadow-none focus-visible:ring-0",
                searchUsername && "bg-primary/5 border-primary/20"
              )}
            >
              <Search className="size-3 mr-1" />
              搜索
              {searchUsername && (
                <>
                  <Separator orientation="vertical" className="mx-1" />
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-3 px-1 rounded-full bg-primary text-primary-foreground"
                  >
                    !
                  </Badge>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px] p-3" align="start">
            <div className="space-y-2">
              <input
                className="w-full h-8 px-2 text-xs border border-dashed rounded-md outline-none focus:border-primary bg-background"
                placeholder="输入用户名搜索..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
              {searchUsername && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-6 text-xs"
                  onClick={() => setSearchUsername("")}
                >
                  清除
                </Button>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-5 border-dashed text-[10px] font-medium shadow-none focus-visible:ring-0",
                statusFilter !== 'all' && "bg-primary/5 border-primary/20"
              )}
            >
              <Filter className="size-3" />
              状态
              {statusFilter !== 'all' && (
                <>
                  <Separator orientation="vertical" className="mx-1" />
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-3 px-1 rounded-full bg-primary text-primary-foreground"
                  >
                    1
                  </Badge>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[120px]" align="start">
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setStatusFilter('all') }}
            >
              <div className={cn(
                "mr-2 flex size-3 items-center justify-center rounded-sm border border-primary",
                statusFilter === 'all'
                  ? "bg-primary text-primary-foreground"
                  : "opacity-50"
              )} />
              <span className="text-xs">全部状态</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setStatusFilter('active') }}
            >
              <div className={cn(
                "mr-2 flex size-3 items-center justify-center rounded-sm border border-primary",
                statusFilter === 'active'
                  ? "bg-primary text-primary-foreground"
                  : "opacity-50"
              )} />
              <span className="text-xs">正常</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setStatusFilter('inactive') }}
            >
              <div className={cn(
                "mr-2 flex size-3 items-center justify-center rounded-sm border border-primary",
                statusFilter === 'inactive'
                  ? "bg-primary text-primary-foreground"
                  : "opacity-50"
              )} />
              <span className="text-xs">禁用</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {(searchUsername || statusFilter !== 'all') && (
          <>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchUsername("")
                setStatusFilter('all')
              }}
              className="h-5 px-2 lg:px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
              清空筛选
            </Button>
          </>
        )}
      </div>

      <Separator className="lg:hidden" />

      <div className="flex items-center gap-1.5 self-end lg:self-auto">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {total} 条记录
        </span>
        <div className="flex items-center border border-dashed rounded-md shadow-none">
          <Button
            variant="ghost"
            size="icon"
            className="h-5.5 w-6 rounded-none rounded-l-md disabled:opacity-30"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="size-3" />
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground px-2 border-x border-dashed">
            {page}/{totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5.5 w-6 rounded-none rounded-r-md disabled:opacity-30"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 border-dashed text-[10px] px-2 font-mono shadow-none" disabled={loading}>
              {pageSize}条/页
              <ChevronDown className="size-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[20, 50, 100].map(size => (
              <DropdownMenuItem
                key={size}
                onClick={() => setPageSize(size)}
                className={cn("font-mono text-xs", pageSize === size && "bg-accent")}
              >
                {size}条/页
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 border-dashed shadow-none"
          onClick={() => fetchUsers(true)}
          disabled={loading}
          title="刷新数据"
        >
          <Loader2 className={cn("size-3", loading && "animate-spin")} />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold">用户管理</div>
        </div>
      </div>

      {renderFilterBar()}

      {error ? (
        <div className="p-8 border border-dashed rounded-lg">
          <ErrorInline error={error} onRetry={() => fetchUsers(true)} className="justify-center" />
        </div>
      ) : loading && users.length === 0 ? (
        <LoadingStateWithBorder icon={Layers} description="加载用户列表中..." />
      ) : users.length === 0 ? (
        <EmptyStateWithBorder icon={UserX} description="暂无用户数据" />
      ) : (
        <div className="border border-dashed shadow-none rounded-lg overflow-hidden">
          <Table className="w-full caption-bottom text-sm min-w-full">
            <TableHeader className="sticky top-0 z-20 bg-background">
              <TableRow className="border-b border-dashed hover:bg-transparent">
                <TableHead className="w-[90px] whitespace-nowrap py-2 h-8">ID</TableHead>
                <TableHead className="w-[120px] whitespace-nowrap py-2 h-8">用户</TableHead>
                <TableHead className="text-right whitespace-nowrap min-w-[80px] py-2 h-8 font-mono">余额</TableHead>
                <TableHead className="text-right whitespace-nowrap min-w-[80px] py-2 h-8 font-mono">基准分</TableHead>
                <TableHead className="text-right whitespace-nowrap min-w-[80px] py-2 h-8 font-mono">支付分</TableHead>
                <TableHead className="text-right whitespace-nowrap min-w-[80px] py-2 h-8 font-mono">总收益</TableHead>
                <TableHead className="text-right whitespace-nowrap min-w-[80px] py-2 h-8 font-mono">总消耗</TableHead>
                <TableHead className="text-right whitespace-nowrap min-w-[80px] py-2 h-8 font-mono">总转移</TableHead>
                <TableHead className="text-right whitespace-nowrap min-w-[80px] py-2 h-8 font-mono is-last-money">总划转</TableHead>
                <TableHead className="whitespace-nowrap min-w-[140px] py-2 h-8 pl-4">上次登陆</TableHead>
                <TableHead className="whitespace-nowrap min-w-[140px] py-2 h-8">注册时间</TableHead>
                <TableHead className="whitespace-nowrap min-w-[140px] py-2 h-8">上次更新</TableHead>
                <TableHead className="sticky right-0 text-center bg-background z-10 w-[80px] py-2 h-8">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-dashed hover:bg-muted/30 cursor-pointer group"
                  onClick={() => handleShowDetail(user)}
                >
                  <TableCell className="font-mono text-[11px] text-muted-foreground py-1">{user.id}</TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 rounded-sm border">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="rounded-sm text-[10px]">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[11px] leading-tight max-w-[100px] truncate" title={user.nickname}>{user.nickname}</span>
                          {user.is_admin && (
                            <Badge variant="secondary" className="text-[9px] h-3.5 px-0.5 rounded-[2px] font-normal leading-none tracking-tighter">
                              ADM
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground font-mono leading-tight">@{user.username}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-green-600 dark:text-green-500 font-medium py-1">
                    {Number(user.available_balance).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] py-1">
                    {Number(user.community_balance).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] py-1">
                    {Number(user.pay_score).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-green-600 py-1">
                    {Number(user.total_receive).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-red-500 py-1">
                    {Number(user.total_payment).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-blue-500 py-1">
                    {Number(user.total_transfer).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-purple-500 py-1 is-last-money">
                    {Number(user.total_community).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground font-mono whitespace-nowrap py-1 pl-4">
                    {formatDateTime(user.last_login_at)}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground font-mono whitespace-nowrap py-1">
                    {formatDateTime(user.created_at)}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground font-mono whitespace-nowrap py-1">
                    {formatDateTime(user.updated_at)}
                  </TableCell>
                  <TableCell className="sticky right-0 text-center bg-background z-10 py-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={user.is_active}
                                onCheckedChange={() => handleStatusToggle(user)}
                                disabled={user.is_admin}
                                className="scale-75 data-[state=checked]:bg-green-600 h-4 w-7"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {user.is_admin ? '管理员账户' : user.is_active ? '禁用账户' : '启用账户'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleUpdateCredits(user)}
                              disabled={updatingUserId === user.id}
                            >
                              <Loader2 className={cn("size-3", updatingUserId === user.id && "animate-spin")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            更新积分
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleShowDetail(user)}>
                              <Eye className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            查看详情
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-[400px] w-full p-0 flex flex-col gap-0">
          <SheetTitle className="px-5 py-3">用户档案</SheetTitle>

          {selectedUser && (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="flex flex-col pb-6">
                  <div className="px-5 py-6 border-b border-border/50">
                    <div className="flex flex-col items-center text-center gap-3">
                      <Avatar className="h-20 w-20 rounded-full border-4 border-background ring-1 ring-border/20">
                        <AvatarImage src={selectedUser.avatar_url} />
                        <AvatarFallback className="rounded-full text-xl font-medium bg-secondary text-secondary-foreground">
                          {selectedUser.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1.5">
                        <h3 className="text-lg font-bold tracking-tight">{selectedUser.nickname}</h3>
                        <div className="flex items-center justify-center gap-2">
                          <code className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground">@{selectedUser.username}</code>
                          <Badge variant="secondary" className="h-4.5 px-1.5 text-[9px] uppercase font-medium">
                            UID: {selectedUser.id}
                          </Badge>
                          <Badge variant="secondary" className="h-4.5 px-1.5 text-[9px] uppercase font-medium">
                            Lv.{selectedUser.trust_level}
                          </Badge>
                          {selectedUser.is_admin && (
                            <Badge className="h-4.5 px-1.5 text-[9px] uppercase font-medium bg-primary text-primary-foreground">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="gap-4 w-full max-w-[240px] mt-1 pt-4 border-t border-border/50">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">注册时间</span>
                          <span className="font-mono text-xs font-semibold">{formatDateTime(selectedUser.created_at).split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">核心资产</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors space-y-2">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          <Wallet className="w-4 h-4" />
                          <span className="text-[10px] font-medium">可用余额</span>
                        </div>
                        <div className="text-lg font-mono font-bold tracking-tight text-foreground truncate">
                          {Number(selectedUser.available_balance).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors space-y-2">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-[10px] font-medium">支付积分</span>
                        </div>
                        <div className="text-lg font-mono font-bold tracking-tight text-foreground truncate">
                          {Number(selectedUser.pay_score).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors space-y-2">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="text-[10px] font-medium">社区余额</span>
                        </div>
                        <div className="text-lg font-mono font-bold tracking-tight text-foreground truncate">
                          {Number(selectedUser.community_balance).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="mx-6 w-auto opacity-50" />

                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">财务概况</h4>
                      <div className="rounded-lg border divide-y bg-background/50">
                        <div className="flex items-center justify-between p-3.5">
                          <span className="text-[10px]">累计收益</span>
                          <span className="font-mono text-[10px] font-medium text-purple-600 dark:text-purple-400">+{Number(selectedUser.total_community).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5">
                          <span className="text-[10px]">累计收入</span>
                          <span className="font-mono text-[10px] font-medium text-green-600">+{Number(selectedUser.total_receive).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5">
                          <span className="text-[10px]">累计支出</span>
                          <span className="font-mono text-[10px] font-medium text-red-500">{Number(selectedUser.total_payment) === 0 ? '0.00' : `-${ Number(selectedUser.total_payment).toFixed(2) }`}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5">
                          <span className="text-[10px]">累计转账</span>
                          <span className="font-mono text-[10px] font-medium text-blue-500">{Number(selectedUser.total_transfer).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">系统记录</h4>
                      <div className="rounded-lg border divide-y bg-background/50">
                        <div className="flex items-center justify-between p-3.5 text-sm">
                          <span className="text-[10px]">最后登录</span>
                          <span className="font-mono text-[10px]">{formatDateTime(selectedUser.last_login_at)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 text-sm">
                          <span className="text-[10px]">注册时间</span>
                          <span className="font-mono text-[10px]">{formatDateTime(selectedUser.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 text-sm">
                          <span className="text-[10px]">最后更新</span>
                          <span className="font-mono text-[10px]">{formatDateTime(selectedUser.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {!selectedUser.is_admin && (
                <div className="p-4 border-t bg-background/80 backdrop-blur-md shrink-0">
                  <Button
                    variant={selectedUser.is_active ? "destructive" : "default"}
                    className={cn(
                      "w-full h-9 text-xs font-medium transition-all active:scale-[0.98]",
                      selectedUser.is_active
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => handleStatusToggle(selectedUser)}
                  >
                    {selectedUser.is_active ? (
                      <>
                        <ShieldCheck className="size-3 mr-1" />
                        封禁账户
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-3 mr-1" />
                        解除封禁
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
