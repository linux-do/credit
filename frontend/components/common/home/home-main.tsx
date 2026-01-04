"use client";

import * as React from "react";
import { TransactionProvider } from "@/contexts/transaction-context";

import { DataPanel } from "@/components/common/home/data-panel";
import { OverviewPanel } from "@/components/common/home/overview-panel";

export function HomeMain() {
  return (
    <TransactionProvider>
      <div className="py-6 space-y-12">
        <div>
          <h1 className="text-2xl font-semibold border-b pb-2 mb-6">今天</h1>
          <DataPanel />
        </div>

        <div>
          <h1 className="text-2xl font-semibold border-b pb-2">近期概览</h1>
          <OverviewPanel />
        </div>
      </div>
    </TransactionProvider>
  );
}
