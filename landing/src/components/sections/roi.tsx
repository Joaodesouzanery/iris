"use client";

import { Clock, FileText, TrendingDown, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { AnimatedCounter } from "@/components/animations/animated-counter";

const stats = [
  {
    icon: Clock,
    value: 40,
    suffix: "h/mês",
    label: "Tempo médio gasto lendo PDFs regulatórios manualmente",
    color: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10",
  },
  {
    icon: FileText,
    value: 3,
    suffix: " dias",
    label: "Para um analista processar uma única ata de reunião da diretoria",
    color: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
  },
  {
    icon: TrendingDown,
    value: 0,
    suffix: " insights",
    label: "Gerados por planilhas manuais sobre padrões de votação",
    color: "text-[#52525B]",
    bg: "bg-white/5",
  },
];

export function ROISection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8B5CF6]/5 to-transparent pointer-events-none" />

      <Container className="relative z-10">
        <FadeIn>
          <SectionHeader
            badge="ROI"
            title="O Custo de Não Ter Inteligência"
            subtitle="Enquanto sua equipe lê PDFs manualmente, decisões críticas passam despercebidas."
          />
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <StaggerItem key={stat.label}>
                <GlowCard className="text-center h-full">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bg} mb-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`text-4xl font-bold mb-2 ${stat.color}`}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} className={stat.color} />
                  </div>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">{stat.label}</p>
                </GlowCard>
              </StaggerItem>
            );
          })}
        </StaggerChildren>

        <FadeIn delay={0.3}>
          <div className="text-center">
            <Button size="lg" href="#demo">
              Solicitar Demonstração
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
