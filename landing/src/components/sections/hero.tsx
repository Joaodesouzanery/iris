"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { HERO_STATS } from "@/lib/constants";

const PARTICLE_COUNT_DESKTOP = 20;
const PARTICLE_COUNT_MOBILE = 8;

function Particles() {
  const count = typeof window !== "undefined" && window.innerWidth < 768
    ? PARTICLE_COUNT_MOBILE
    : PARTICLE_COUNT_DESKTOP;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="particle absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0
              ? "rgba(139, 92, 246, 0.4)"
              : i % 3 === 1
                ? "rgba(6, 182, 212, 0.3)"
                : "rgba(245, 158, 11, 0.2)",
            "--duration": `${Math.random() * 8 + 6}s`,
            "--delay": `${Math.random() * 4}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function HeroSection() {
  const headlineWords = ["Dados", "Regulatórios", "Viram", "Inteligência", "Estratégica"];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center hero-gradient grid-pattern overflow-hidden"
    >
      <Particles />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[128px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06B6D4]/8 rounded-full blur-[128px] pointer-events-none" aria-hidden="true" />

      <Container className="relative z-10 pt-32 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
            </span>
            <span className="text-sm text-[#A1A1AA] font-medium">
              Monitoramento ativo 24/7
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            {headlineWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4 + i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`inline-block mr-[0.25em] ${
                  i >= 3 ? "gradient-text gradient-text-animated" : "text-white"
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-[#A1A1AA] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A IRIS coleta, classifica e analisa automaticamente milhares de decisões
            regulatórias. Em tempo real. Com IA.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button size="lg" href="#demo">
              Solicitar Demonstração
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="lg" href="#modulos">
              <Play className="w-5 h-5" />
              Ver Módulos
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    className="text-white"
                  />
                </div>
                <div className="text-sm text-[#A1A1AA]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none" />
    </section>
  );
}
