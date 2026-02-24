"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/animations/fade-in";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { MODULES, MODULE_CATEGORIES } from "@/lib/constants";

type Category = (typeof MODULE_CATEGORIES)[number];

const categoryColors: Record<string, "purple" | "cyan" | "amber" | "success"> = {
  Coleta: "cyan",
  Análise: "purple",
  Visualização: "amber",
  Auditoria: "success",
};

export function ModulesSection() {
  const [activeCategory, setActiveCategory] = useState<Category>("Todos");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const filtered = activeCategory === "Todos"
    ? MODULES
    : MODULES.filter((m) => m.category === activeCategory);

  const selected = MODULES.find((m) => m.id === selectedModule);

  return (
    <section id="modulos" className="py-24 md:py-32 relative">
      <Container>
        <FadeIn>
          <SectionHeader
            badge="Módulos"
            title="14 Módulos. Uma Plataforma."
            subtitle="Cada módulo resolve um problema específico. Juntos, formam o sistema de inteligência regulatória mais completo do mercado."
          />
        </FadeIn>

        {/* Category filters */}
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {MODULE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20"
                    : "bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Module grid */}
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((mod) => {
              const Icon = mod.icon;
              return (
                <StaggerItem key={mod.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button
                      onClick={() => setSelectedModule(mod.id)}
                      className="w-full text-left cursor-pointer"
                    >
                      <GlowCard className="h-full group transition-all duration-250 hover:scale-[1.02]">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#8B5CF6]/10 transition-colors">
                            <Icon className="w-5 h-5 text-[#A1A1AA] group-hover:text-[#8B5CF6] transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {mod.title}
                            </h3>
                            <Badge variant={categoryColors[mod.category] || "default"} className="mt-1">
                              {mod.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-2">
                          {mod.description}
                        </p>
                      </GlowCard>
                    </button>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </AnimatePresence>
        </StaggerChildren>

        {/* Module detail modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedModule(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card max-w-lg w-full p-8 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedModule(null)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 text-[#A1A1AA]" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center">
                    <selected.icon className="w-7 h-7 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selected.title}</h3>
                    <Badge variant={categoryColors[selected.category] || "default"}>
                      {selected.category}
                    </Badge>
                  </div>
                </div>

                <p className="text-[#A1A1AA] leading-relaxed mb-6">{selected.description}</p>

                <div className="flex flex-wrap gap-2">
                  {selected.metrics.map((metric) => (
                    <span
                      key={metric}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-[#06B6D4] border border-[#06B6D4]/20"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
}
