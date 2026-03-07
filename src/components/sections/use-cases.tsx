"use client";

import { Shield, BarChart3, Scale, Eye } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GlowCard } from "@/components/ui/glow-card";
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { USE_CASES } from "@/lib/constants";

const iconMap = {
  shield: Shield,
  "bar-chart": BarChart3,
  scale: Scale,
  eye: Eye,
};

const colors = [
  { icon: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10", border: "border-[#8B5CF6]/20" },
  { icon: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10", border: "border-[#06B6D4]/20" },
  { icon: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20" },
  { icon: "text-[#22C55E]", bg: "bg-[#22C55E]/10", border: "border-[#22C55E]/20" },
];

export function UseCasesSection() {
  return (
    <section id="casos-de-uso" className="py-24 md:py-32 bg-[#111113]/30">
      <Container>
        <FadeIn>
          <SectionHeader
            badge="Casos de Uso"
            title="Inteligência Para Cada Necessidade"
            subtitle="Diferentes perfis, um objetivo comum: transformar dados regulatórios em vantagem estratégica."
          />
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {USE_CASES.map((uc, i) => {
            const Icon = iconMap[uc.icon as keyof typeof iconMap];
            const color = colors[i];
            return (
              <StaggerItem key={uc.title}>
                <GlowCard className="h-full">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${color.icon}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-mono ${color.icon} mb-1`}>{uc.persona}</p>
                      <h3 className="text-lg font-bold text-white mb-2">{uc.title}</h3>
                      <p className="text-sm text-[#A1A1AA] leading-relaxed">{uc.description}</p>
                    </div>
                  </div>
                </GlowCard>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </Container>
    </section>
  );
}
