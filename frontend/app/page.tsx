"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { HeroSection } from "@/components/home/hero-section";
import { StatsSection } from "@/components/home/stats-section";
import { FeaturesSection } from "@/components/home/features-section";
import { DeveloperSection } from "@/components/home/developer-section";
import { FooterSection } from "@/components/home/footer-section";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
}

export function GlassCard({
  children,
  className,
  gradient = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-background/60 backdrop-blur-xl transition-all duration-300 hover:bg-background/80 hover:border-foreground/20 hover:shadow-xl hover:shadow-foreground/5",
        "dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30 dark:hover:shadow-black/5",
        gradient &&
        "bg-gradient-to-br from-background/80 to-background/40 dark:from-white/10 dark:to-white/5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative w-full h-screen overflow-y-scroll snap-y snap-mandatory bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AuroraBackground>
          <div />
        </AuroraBackground>
      </div>

      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DeveloperSection />
      <FooterSection />

    </div>
  )
}
