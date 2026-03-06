"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NAV_LINKS } from "@/lib/constants";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for active section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionIds = NAV_LINKS.map((l) => l.href.replace("#", ""));

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -40% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <Container>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="#hero" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center">
                <span className="text-white font-bold text-sm">IR</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                IRIS
              </span>
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-150 relative rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] ${
                    activeSection === link.href.replace("#", "")
                      ? "text-[#8B5CF6]"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  {link.label}
                  {activeSection === link.href.replace("#", "") && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#8B5CF6] rounded-full"
                    />
                  )}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Button size="sm" asChild>
                <a href="#demo">Solicitar Demo</a>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMobileOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </Container>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#09090B]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`text-2xl font-semibold transition-colors ${
                    activeSection === link.href.replace("#", "")
                      ? "text-[#8B5CF6]"
                      : "text-white hover:text-[#8B5CF6]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <Button size="lg" asChild>
                <a href="#demo" onClick={() => setIsMobileOpen(false)}>
                  Solicitar Demo
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
