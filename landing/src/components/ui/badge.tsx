import { type ReactNode } from "react";

type BadgeVariant = "default" | "purple" | "cyan" | "amber" | "success" | "error";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-[#A1A1AA]",
  purple: "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/20",
  cyan: "bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/20",
  amber: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/20",
  success: "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/20",
  error: "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/20",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
        border border-transparent
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
