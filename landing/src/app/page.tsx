import { Navbar } from "@/components/sections/navbar";
import { HeroSection } from "@/components/sections/hero";
import { SocialProofSection } from "@/components/sections/social-proof";
import { FeaturesSection } from "@/components/sections/features";
import { ModulesSection } from "@/components/sections/modules";
import { PipelineSection } from "@/components/sections/pipeline";
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
        <FeaturesSection />
        <PipelineSection />
        <ModulesSection />
        <UseCasesSection />
        <ROISection />
        <FAQSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
