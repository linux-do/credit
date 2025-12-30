"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UserService } from "@/lib/services/user"

/* 表单验证规则 */
const payKeySchema = z.object({
  newPayKey: z
    .string()
    .min(6, "密码必须是6位数字")
    .max(6, "密码必须是6位数字")
    .regex(/^\d{6}$/, "密码只能包含数字"),
  confirmPayKey: z.string(),
}).refine((data) => data.newPayKey === data.confirmPayKey, {
  message: "两次输入的密码不一致",
  path: ["confirmPayKey"],
})

type PayKeyFormValues = z.infer<typeof payKeySchema>

export function SecurityMain() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<PayKeyFormValues>({
    resolver: zodResolver(payKeySchema),
    defaultValues: {
      newPayKey: "",
      confirmPayKey: "",
    },
  })

  const onSubmit = async (data: PayKeyFormValues) => {
    try {
      setIsSubmitting(true)
      await UserService.updatePayKey(data.newPayKey)

      toast.success("修改成功", {
        description: "您的密码已成功更新",
      })

      /* 重置表单 */
      form.reset()
    } catch (error) {
      toast.error("修改失败", {
        description: error instanceof Error ? error.message : "更新密码时发生错误，请稍后重试",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const router = useRouter()

  const handleCancel = () => {
    router.push("/settings")
  }

  return (
    <div className="py-6 space-y-6">
      <div className="font-semibold">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/settings" className="text-base text-primary">设置</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-base font-semibold">安全设置</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-6">
        <div className="font-medium text-sm text-muted-foreground">密码安全</div>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <FormField
                control={form.control}
                name="newPayKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">新密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入6位数字密码"
                        maxLength={6}
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPayKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">确认密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请再次输入6位密码"
                        maxLength={6}
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting} size="sm">
                  {isSubmitting ? "保存中" : "保存"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
