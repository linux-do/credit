"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import { PayingNow } from "@/components/common/pay/paying/paying-now";
import { PayingInfo } from "@/components/common/pay/paying/paying-info";

import services from "@/lib/services";
import type { GetMerchantOrderResponse } from "@/lib/services";

/**
 * 积分认证主页面组件
 * 通过 order_no 查询订单信息并完成积分认证
 */
export function PayingMain() {
  /** 获取URL参数中的认证编号 */
  const searchParams = useSearchParams();
  const router = useRouter();
  const encryptedOrderNo = searchParams.get("order_no");

  /** 组件状态管理 */
  const [orderInfo, setOrderInfo] = useState<GetMerchantOrderResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payKey, setPayKey] = useState("");
  const [currentStep, setCurrentStep] = useState<"method" | "pay">("method");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  /** 统一的服务错误处理函数 */
  const handleServiceError = (error: unknown, operation: string) => {
    console.error(`${operation}失败:`, error);

    let errorMessage = `${operation}失败`;
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = String(error.message);
    }

    const errorMap: Record<string, string> = {
      订单不存在: "此积分流转服务不存在或已过期",
      未登录: "请先登录后再进行认证",
      余额不足: "您的积分余额不足",
      安全密码: "安全密码错误",
      不能认证自己的订单: "不能认证自己创建的积分流转服务",
      每日限额: "已达到每日认证限额",
      已完成: "认证完成",
    };

    const userMessage =
      Object.entries(errorMap).find(([key]) =>
        errorMessage.includes(key)
      )?.[1] || errorMessage;

    toast.error(userMessage, { id: "payment-error" });
  };

  /** 组件初始化时查询订单信息 */
  useEffect(() => {
    if (encryptedOrderNo) {
      setError(false);
      handleQueryOrder(encryptedOrderNo);
    } else {
      setLoading(false);
      setError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryptedOrderNo]);

  /** 查询订单信息 */
  const handleQueryOrder = async (queryOrderNo?: string) => {
    const targetOrderNo = queryOrderNo || encryptedOrderNo;
    if (!targetOrderNo) {
      toast.error("缺少认证编号", { id: "missing-order-no" });
      return;
    }

    setLoading(true);
    try {
      const data = await services.merchant.getMerchantOrder({
        order_no: targetOrderNo,
      });
      setOrderInfo(data);
      setError(false);
    } catch (error: unknown) {
      handleServiceError(error, "查询认证信息");
      setOrderInfo(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  /** 执行积分认证操作 */
  const handlePayOrder = async () => {
    if (!orderInfo) return;

    if (!payKey.trim()) {
      toast.error("请输入安全密码");
      return;
    }

    if (payKey.length !== 6) {
      toast.error("安全密码长度为6位，请重新输入");
      return;
    }

    setPaying(true);
    try {
      const freshOrderInfo = await services.merchant.getMerchantOrder({
        order_no: encryptedOrderNo!,
      });

      if (freshOrderInfo.order.status !== "pending") {
        toast.error("此积分流转服务状态已变更，无法认证");
        setOrderInfo(freshOrderInfo);
        return;
      }

      await services.merchant.payMerchantOrder({
        order_no: encryptedOrderNo!,
        pay_key: payKey,
      });

      toast.success("积分流转服务认证成功！", { id: "payment-success" });

      /** 支付成功后立即更新订单状态为成功 */
      if (orderInfo) {
        setOrderInfo({
          ...orderInfo,
          order: {
            ...orderInfo.order,
            status: "success",
          },
        });
      }

      /** 5秒后跳转到redirect_uri或刷新页面 */
      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;

        const redirectUri = orderInfo?.merchant?.redirect_uri;
        if (redirectUri && redirectUri.trim()) {
          window.location.href = redirectUri;
          return;
        }

        router.push("/home");
      }, 5000);
    } catch (error: unknown) {
      handleServiceError(error, "认证");

      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        String(error.message).includes("已完成")
      ) {
        timeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          window.location.reload();
        }, 500);
      }
    } finally {
      setPaying(false);
    }
  };

  if (error) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className="w-full rounded-3xl p-8 max-w-lg">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-500/10">
                <div className="size-8 text-red-500 font-bold text-4xl flex items-center justify-center">
                  !
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                出了点问题
              </h1>
              <p className="text-muted-foreground text-sm">
                您访问的认证编号已经完成认证或不存在。请检查您的积分流转服务链接是否正确，对此如有疑问请联系社区技术支持。
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full font-sans text-foreground overflow-hidden bg-background selection:bg-primary/30">
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col md:flex-row w-full max-w-4xl bg-card/70 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl"
            style={{ minHeight: "auto" }}
          >
            <PayingInfo orderInfo={orderInfo!} loading={loading} />
            <PayingNow
              orderInfo={orderInfo}
              paying={paying}
              payKey={payKey}
              currentStep={currentStep}
              selectedMethod={selectedMethod}
              isOpen={isOpen}
              loading={loading}
              onPayKeyChange={setPayKey}
              onCurrentStepChange={setCurrentStep}
              onSelectedMethodChange={setSelectedMethod}
              onIsOpenChange={setIsOpen}
              onPayOrder={handlePayOrder}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
