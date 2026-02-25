"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/sections/navbar";
import { HeroSection } from "@/components/sections/hero";
import { SocialProofSection } from "@/components/sections/social-proof";
import { PipelineSection } from "@/components/sections/pipeline";
import { FeaturesSection } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";

// Code splitting: lazy-load below-the-fold sections
const ModulesSection = dynamic(() => import("@/components/sections/modules").then(m => ({ default: m.ModulesSection })));
const UseCasesSection = dynamic(() => import("@/components/sections/use-cases").then(m => ({ default: m.UseCasesSection })));
const ROISection = dynamic(() => import("@/components/sections/roi").then(m => ({ default: m.ROISection })));
const DemoSection = dynamic(() => import("@/components/sections/demo").then(m => ({ default: m.DemoSection })));
const FAQSection = dynamic(() => import("@/components/sections/faq").then(m => ({ default: m.FAQSection })));

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
