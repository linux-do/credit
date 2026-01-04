"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ErrorContext = React.createContext<boolean>(false);

function InputOTP({
  className,
  containerClassName,
  error,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
  error?: boolean;
}) {
  return (
    <ErrorContext.Provider value={error || false}>
      <OTPInput
        data-slot="input-otp"
        containerClassName={cn(
          "flex items-center gap-2 has-disabled:opacity-50",
          containerClassName
        )}
        className={cn("disabled:cursor-not-allowed", className)}
        {...props}
      />
    </ErrorContext.Provider>
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
  mask?: boolean;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const hasError = React.useContext(ErrorContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  const slots = inputOTPContext?.slots ?? [];
  const isAllFilled = slots.length >= 6 && slots.every((slot) => slot.char);

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border text-sm shadow-xs transition-all outline-none first:rounded-l-md last:rounded-r-md data-[active=true]:z-10",
        // 基础边框样式 - 错误时使用红色边框
        hasError
          ? "border-destructive dark:bg-input/30"
          : "border-input dark:bg-input/30",
        // 聚焦样式 - 错误时使用红色聚焦边框
        "data-[active=true]:ring-0 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        hasError
          ? "data-[active=true]:border-destructive"
          : "data-[active=true]:border-primary",
        className
      )}
      {...props}
    >
      {isAllFilled || (char && !isActive) ? "●" : char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
