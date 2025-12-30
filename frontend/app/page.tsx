"use client";

import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  DeveloperSection,
  FooterSection,
} from "@/components/home";

export default function HomePage() {
  return (
    <div className="relative w-full h-screen overflow-y-scroll snap-y snap-proximity bg-transparent text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground z-10 scrollbar-hide">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DeveloperSection />
      <FooterSection />
    </div>
  );
}
