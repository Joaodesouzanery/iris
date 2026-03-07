"use client";

import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { FadeIn } from "@/components/animations/fade-in";
import { DemoForm } from "@/components/forms/demo-form";

export function DemoSection() {
  return (
    <section id="demo" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/5 rounded-full blur-[128px] pointer-events-none" />

      <Container className="relative z-10">
        <FadeIn>
          <SectionHeader
            badge="Demonstração"
            title="Veja a IRIS em Ação"
            subtitle="Preencha o formulário e receba uma demonstração personalizada para o seu caso de uso."
          />
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="max-w-xl mx-auto glass-card p-6 md:p-8">
            <DemoForm />
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
