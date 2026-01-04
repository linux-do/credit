"use client";

import { HeroSection } from "@/components/home/hero-section";
import { DeveloperSection } from "@/components/home/developer-section";
import { FooterSection } from "@/components/home/footer-section";

export default function HomePage() {
  return (
    <div className="relative w-full min-h-screen bg-transparent text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground z-10">
      <HeroSection />
      <DeveloperSection />
      <FooterSection />
    </div>
  )
}
