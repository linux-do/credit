"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LoginForm } from "@/components/auth/login-form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Check } from "lucide-react";

import { AuroraBackground } from "@/components/ui/aurora-background";
import services from "@/lib/services";

/**
 * 登录页面组件
 * 显示登录表单和登录按钮
 *
 * @example
 * ```tsx
 * <LoginPage />
 * ```
 * @returns {React.ReactNode} 登录页面组件
 */
export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* 处理OAuth回调 */
  const [isProcessingCallback, setIsProcessingCallback] = useState(() => {
    const state = searchParams.get("state");
    const code = searchParams.get("code");
    return !!(state && code);
  });

  const [loginSuccess, setLoginSuccess] = useState(false);
  const [needsPayKeySetup, setNeedsPayKeySetup] = useState(false);

  const [payKey, setPayKey] = useState("");
  const [confirmPayKey, setConfirmPayKey] = useState("");
  const [isSubmittingPayKey, setIsSubmittingPayKey] = useState(false);
  const [setupStep, setSetupStep] = useState<"password" | "confirm">(
    "password"
  );

  const isPayKeyValid = payKey.length === 6 && /^\d{6}$/.test(payKey);
  const isConfirmValid =
    confirmPayKey.length === 6 && /^\d{6}$/.test(confirmPayKey);
  const passwordsMatch = payKey === confirmPayKey;

  /* 安全密码输入 */
  const handlePayKeyChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setPayKey(numericValue);
  };

  /* 确认安全密码 */
  const handleConfirmPayKeyChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setConfirmPayKey(numericValue);
  };

  /* 回调逻辑 */
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const state = searchParams.get("state");
      const code = searchParams.get("code");

      if (state && code) {
        setIsProcessingCallback(true);
        try {
          await services.auth.handleCallback({ state, code });

          const user = await services.auth.getUserInfo();

          if (!user.is_pay_key) {
            setNeedsPayKeySetup(true);
          } else {
            setLoginSuccess(true);
            toast.success("登录成功");

            const callbackUrl =
              searchParams.get("callbackUrl") ||
              sessionStorage.getItem("redirect_after_login") ||
              "/home";
            if (sessionStorage.getItem("redirect_after_login")) {
              sessionStorage.removeItem("redirect_after_login");
            }

            setTimeout(() => {
              router.replace(callbackUrl);
            }, 1500);
          }
        } catch (error) {
          console.error("OAuth callback error:", error);
          toast.error(
            error instanceof Error ? error.message : "登录失败，请重试"
          );
          setIsProcessingCallback(false);
          router.replace("/login");
        }
      }
    };
    handleOAuthCallback();
  }, [searchParams, router]);

  /* 安全密码设置 */
  const handlePayKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (setupStep === "password") {
      if (!isPayKeyValid) {
        toast.error("安全密码必须为6位数字");
        return;
      }
      setSetupStep("confirm");
    } else {
      if (!isConfirmValid) {
        toast.error("确认密码必须为6位数字");
        return;
      }

      if (!passwordsMatch) {
        toast.error("两次输入的安全密码不一致");
        setSetupStep("password");
        setConfirmPayKey("");
        return;
      }

      setIsSubmittingPayKey(true);
      try {
        await services.user.updatePayKey(payKey);
        toast.success("安全密码设置成功");
        setNeedsPayKeySetup(false);
        setLoginSuccess(true);
        setPayKey("");
        setConfirmPayKey("");
        setSetupStep("password");
        setTimeout(() => {
          const callbackUrl =
            searchParams.get("callbackUrl") ||
            sessionStorage.getItem("redirect_after_login") ||
            "/home";
          if (sessionStorage.getItem("redirect_after_login")) {
            sessionStorage.removeItem("redirect_after_login");
          }
          router.replace(callbackUrl);
        }, 1500);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "设置安全密码失败";
        toast.error(errorMessage);
        setSetupStep("password");
        setConfirmPayKey("");
      } finally {
        setIsSubmittingPayKey(false);
      }
    }
  };

  /* 渲染 PayKey 设置界面 */
  const renderPayKeySetup = (key: string) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full space-y-8"
    >
      <div className="flex flex-col items-center gap-2 mb-4">
        <h3 className="text-base font-bold tracking-tight text-center">
          {setupStep === "password" ? "设置安全密码" : "确认安全密码"}
        </h3>
        <p className="text-xs text-muted-foreground text-center max-w-[320px] mx-auto">
          {setupStep === "password"
            ? "请设置6位数字安全密码，用于安全操作"
            : "请再次输入密码进行确认"}
        </p>
      </div>

      <form onSubmit={handlePayKeySubmit} className="space-y-6">
        <div className="flex justify-center">
          {setupStep === "password" ? (
            <InputOTP
              maxLength={6}
              value={payKey}
              onChange={handlePayKeyChange}
              disabled={isSubmittingPayKey}
              autoFocus
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-9 h-9 border-input"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          ) : (
            <div className="space-y-4">
              <InputOTP
                maxLength={6}
                value={confirmPayKey}
                onChange={handleConfirmPayKeyChange}
                disabled={isSubmittingPayKey}
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-9 h-9 text-lg border-input"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {!passwordsMatch && confirmPayKey.length === 6 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 text-center font-medium"
                >
                  两次输入的密码不一致
                </motion.p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 mx-12">
          {setupStep === "confirm" && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSetupStep("password");
                setConfirmPayKey("");
              }}
              className="flex-1 h-9 rounded-full tracking-wide text-sm font-bold transition-all active:scale-95"
            >
              返回
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 h-9 rounded-full tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
            disabled={
              setupStep === "password"
                ? !isPayKeyValid
                : isSubmittingPayKey || !isConfirmValid
            }
          >
            {isSubmittingPayKey && <Spinner className="mr-1" />}
            {setupStep === "password" ? "继续" : "完成"}
          </Button>
        </div>
      </form>
    </motion.div>
  );

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            LINUX DO{" "}
            <span className="font-serif italic text-primary">Credit</span>
          </h1>
          <p className="text-sm text-muted-foreground font-light">
            简单、安全，专为社区设计
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isProcessingCallback ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {needsPayKeySetup ? (
                renderPayKeySetup("oauth-pay-key-setup")
              ) : loginSuccess ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-2">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 ring-1 ring-green-500/20"
                  >
                    <Check className="w-6 h-6" strokeWidth={3} />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold tracking-tight text-foreground">
                      登录成功
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      正在跳转至控制台...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 py-2">
                  <div className="relative">
                    <Spinner className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold tracking-tight text-foreground">
                      正在验证凭据
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      请稍候，我们正在为您建立安全会话...
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="login-form-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <LoginForm />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LINUX DO Credit. 版权所有
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
