"use client";

import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/animations/fade-in";
import { AGENCIES } from "@/lib/constants";

export function SocialProofSection() {
  return (
    <section className="py-12 border-y border-white/5 bg-[#111113]/50">
      <Container>
        <FadeIn>
          <div className="text-center">
            <p className="text-sm text-[#52525B] uppercase tracking-wider font-medium mb-6">
              Agências monitoradas pela plataforma
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {AGENCIES.map((agency) => (
                <span
                  key={agency}
                  className="text-[#52525B] hover:text-[#A1A1AA] transition-colors duration-200 font-mono text-sm md:text-base font-semibold tracking-wide"
                >
                  {agency}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#52525B] mt-4">
              Inteligência para quem regula e quem é regulado
            </p>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
