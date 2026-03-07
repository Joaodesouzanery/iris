"use client";

import { type ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlowCard({ children, className = "", hover = true }: GlowCardProps) {
  return (
    <div
      className={`
        relative rounded-2xl p-6
        bg-[rgba(255,255,255,0.05)] backdrop-blur-xl
        border border-white/10
        transition-all duration-300
        ${hover ? "hover:border-[#8B5CF6]/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
