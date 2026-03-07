import { Badge } from "./badge";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeader({ badge, title, subtitle, align = "center" }: SectionHeaderProps) {
  return (
    <div className={`mb-16 ${align === "center" ? "text-center" : "text-left"}`}>
      {badge && (
        <Badge variant="purple" className="mb-4">
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#FAFAFA] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
