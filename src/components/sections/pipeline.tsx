"use client";

import { Download, Cpu, Brain, Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GlowCard } from "@/components/ui/glow-card";
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { PIPELINE_STEPS } from "@/lib/constants";

const iconMap = {
  download: Download,
  cpu: Cpu,
  brain: Brain,
  zap: Zap,
};

const iconColors = [
  "text-[#8B5CF6]",
  "text-[#06B6D4]",
  "text-[#F59E0B]",
  "text-[#22C55E]",
];

const bgColors = [
  "bg-[#8B5CF6]/10",
  "bg-[#06B6D4]/10",
  "bg-[#F59E0B]/10",
  "bg-[#22C55E]/10",
];

export function PipelineSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 relative">
      <Container>
        <FadeIn>
          <SectionHeader
            badge="Como Funciona"
            title="Do PDF Bruto à Inteligência Acionável"
            subtitle="Quatro etapas automatizadas transformam documentos regulatórios em vantagem competitiva."
          />
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = iconMap[step.icon as keyof typeof iconMap];
            return (
              <StaggerItem key={step.step}>
                <GlowCard className="h-full relative">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-1 text-6xl font-black text-white/[0.03] select-none">
                    {step.step}
                  </div>

                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bgColors[i]} mb-4`}>
                    <Icon className={`w-6 h-6 ${iconColors[i]}`} />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-[#52525B]">
                      {String(step.step).padStart(2, "0")}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">{step.description}</p>
                </GlowCard>
              </StaggerItem>
            );
          })}
        </StaggerChildren>

        {/* Connector line (desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] h-px bg-gradient-to-r from-[#8B5CF6]/20 via-[#06B6D4]/20 to-[#22C55E]/20" />
      </Container>
    </section>
  );
}
