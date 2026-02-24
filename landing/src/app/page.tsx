"use client";

import { Navbar } from "@/components/sections/navbar";
import { HeroSection } from "@/components/sections/hero";
import { SocialProofSection } from "@/components/sections/social-proof";
import { PipelineSection } from "@/components/sections/pipeline";
import { FeaturesSection } from "@/components/sections/features";
import { ModulesSection } from "@/components/sections/modules";
import { UseCasesSection } from "@/components/sections/use-cases";
import { ROISection } from "@/components/sections/roi";
import { FAQSection } from "@/components/sections/faq";
import { DemoSection } from "@/components/sections/demo";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <SocialProofSection />
        <PipelineSection />
        <FeaturesSection />
        <ModulesSection />
        <UseCasesSection />
        <ROISection />
        <DemoSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
