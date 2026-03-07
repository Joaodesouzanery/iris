"use client";

import { Database, Brain, Globe } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GlowCard } from "@/components/ui/glow-card";
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";

const features = [
  {
    icon: Database,
    color: "text-[#8B5CF6]",
    bg: "bg-[#8B5CF6]/10",
    title: "Motor de Coleta",
    description:
      "Esqueça a leitura manual de diários oficiais. A IRIS monitora fontes regulatórias 24/7, faz download automático de documentos e extrai texto de qualquer PDF — inclusive escaneados.",
    highlights: ["Coleta 24/7", "Anti-bloqueio", "Extração PDF"],
  },
  {
    icon: Brain,
    color: "text-[#06B6D4]",
    bg: "bg-[#06B6D4]/10",
    title: "Cérebro Analítico",
    description:
      "Classificação inteligente de deliberações. Jurimetria de votos por diretor. Detecção de padrões anômalos. Mapeamento de conexões entre empresas e decisores. Não é dashboard — é inteligência.",
    highlights: ["Classificação IA", "Jurimetria", "Anomalias"],
  },
  {
    icon: Globe,
    color: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
    title: "Inteligência Multi-Agência",
    description:
      "ARTESP é só o começo. A IRIS foi arquitetada para cobrir múltiplas agências reguladoras. Uma plataforma. Todos os dados. Vantagem estratégica real.",
    highlights: ["Multi-Agência", "9+ Agências", "Escalável"],
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-[#111113]/30">
      <Container>
        <FadeIn>
          <SectionHeader
            badge="Plataforma"
            title="Três Pilares de Inteligência"
            subtitle="Da coleta automatizada à análise preditiva — cada camada foi desenhada para gerar vantagem competitiva."
          />
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title}>
                <GlowCard className="h-full">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.bg} mb-6`}>
                    <Icon className={`w-7 h-7 ${feature.color}`} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-[#A1A1AA] leading-relaxed mb-6">{feature.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((h) => (
                      <span
                        key={h}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-[#A1A1AA] border border-white/10"
                      >
                        {h}
                      </span>
                    ))}
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
