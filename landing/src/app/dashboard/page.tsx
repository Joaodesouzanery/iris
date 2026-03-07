"use client";

import * as React from "react";
import {
  Search,
  LayoutDashboard,
  FileText,
  MonitorDot,
  Users,
  Scale,
  ShieldAlert,
  Upload,
  Rss,
  Settings,
  HelpCircle,
  ChevronDown,
  MoreHorizontal,
  Info,
  Eye,
  CheckCircle,
  ArrowUpDown,
  TrendingUp,
  ArrowLeft,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ───────── Sidebar Data ───────── */
const mainMenu = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "Deliberações" },
  { icon: MonitorDot, label: "Monitor de Reuniões" },
  { icon: Users, label: "Diretores" },
  { icon: Scale, label: "Jurimetria" },
  { icon: ShieldAlert, label: "Auditoria Forense" },
  { icon: Upload, label: "Upload de PDFs" },
];

const intelligence = [
  { icon: Rss, label: "Feed de Notícias" },
  { icon: TrendingUp, label: "Radar Regulatório" },
];

const config = [
  { icon: HelpCircle, label: "Central de Ajuda" },
  { icon: Settings, label: "Configurações" },
];

/* ───────── Chart Data ───────── */
const monthlyData = [
  { month: "JAN", deferidas: 28, indeferidas: 8 },
  { month: "FEV", deferidas: 35, indeferidas: 12 },
  { month: "MAR", deferidas: 42, indeferidas: 9 },
  { month: "ABR", deferidas: 38, indeferidas: 15 },
  { month: "MAI", deferidas: 51, indeferidas: 11 },
  { month: "JUN", deferidas: 47, indeferidas: 14 },
  { month: "JUL", deferidas: 55, indeferidas: 10 },
  { month: "AGO", deferidas: 60, indeferidas: 13 },
  { month: "SET", deferidas: 52, indeferidas: 16 },
  { month: "OUT", deferidas: 58, indeferidas: 12 },
  { month: "NOV", deferidas: 63, indeferidas: 9 },
  { month: "DEZ", deferidas: 45, indeferidas: 11 },
];

/* ───────── Recent Deliberations ───────── */
const deliberacoes = [
  { id: "DEL-2025-0891", tipo: "Pleito Externo", empresa: "AutoBAn", decisao: "Deferido", diretor: "Dir. Silva", data: "07/03/2025" },
  { id: "DEL-2025-0890", tipo: "Ato Interno", empresa: "CCR ViaOeste", decisao: "Deferido", diretor: "Dir. Santos", data: "06/03/2025" },
  { id: "DEL-2025-0889", tipo: "Pleito Externo", empresa: "EcoRodovias", decisao: "Indeferido", diretor: "Dir. Oliveira", data: "05/03/2025" },
  { id: "DEL-2025-0888", tipo: "Ato Interno", empresa: "Arteris", decisao: "Deferido", diretor: "Dir. Lima", data: "04/03/2025" },
  { id: "DEL-2025-0887", tipo: "Pleito Externo", empresa: "Ecopistas", decisao: "Deferido", diretor: "Dir. Silva", data: "03/03/2025" },
];

/* ───────── Stat Card Mini Bars ───────── */
function MiniBars({ color = "#8B5CF6" }: { color?: string }) {
  const bars = [40, 65, 45, 80, 55, 70, 50];
  return (
    <div className="flex items-end gap-[3px] h-10">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[4px] rounded-sm"
          style={{ height: `${h}%`, backgroundColor: color }}
        />
      ))}
    </div>
  );
}

/* ───────── Custom Tooltip ───────── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1A1A1F] border border-white/10 rounded-lg p-3 text-xs font-mono">
      <p className="text-white font-bold mb-2">{label} 2025</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: i === 0 ? "#22C55E" : "#EF4444" }}
          />
          <span className="text-[#A1A1AA]">
            {p.dataKey === "deferidas" ? "Deferidas" : "Indeferidas"}
          </span>
          <span className="text-white font-bold ml-auto">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────── Sidebar Section ───────── */
function SidebarSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ icon: React.ElementType; label: string; active?: boolean }>;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider mb-2 px-3">
        {title}
      </p>
      {items.map((item) => (
        <a
          key={item.label}
          href="#"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
            item.active
              ? "text-[#8B5CF6] bg-[#8B5CF6]/10"
              : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
          }`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </a>
      ))}
    </div>
  );
}

/* ───────── Main Dashboard ───────── */
export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-[#09090B] text-white font-mono overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#0F0F12] border-r border-white/5 flex flex-col overflow-y-auto shrink-0 hidden lg:flex">
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#6B7280]">Plataforma</p>
              <p className="text-sm font-bold truncate">IRIS Regulatória</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>

        <div className="flex-1 p-2 overflow-y-auto">
          <SidebarSection title="Menu Principal" items={mainMenu} />
          <SidebarSection title="Inteligência" items={intelligence} />
          <SidebarSection title="Configurações" items={config} />
        </div>

        {/* Back to landing */}
        <div className="p-3 border-t border-white/5">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Site
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-[#09090B]/80 backdrop-blur-sm border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280]">IRIS</span>
              <span className="text-[#6B7280]">&gt;</span>
              <span className="text-[#8B5CF6]">Dashboard Regulatório</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#111113] border border-white/10 rounded-lg px-3 py-2 w-64">
                <Search className="w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Buscar deliberações..."
                  className="bg-transparent text-sm outline-none flex-1 text-white placeholder-[#6B7280] font-mono"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Welcome */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Painel Regulatório ARTESP</h1>
              <p className="text-sm text-[#6B7280] mt-1">Monitoramento em tempo real de deliberações e decisões</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
              </span>
              <span className="text-xs text-[#22C55E]">Monitoramento ativo</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { title: "DELIBERAÇÕES PROCESSADAS", value: "1.247", icon: FileText, change: "+12% vs mês anterior", color: "#8B5CF6" },
              { title: "TAXA DE DEFERIMENTO", value: "78,3%", icon: TrendingUp, change: "+2,1% vs mês anterior", color: "#22C55E" },
              { title: "ANOMALIAS DETECTADAS", value: "23", icon: AlertTriangle, change: "3 críticas pendentes", color: "#F59E0B" },
              { title: "ÚLTIMA COLETA", value: "12min", icon: Clock, change: "Próxima em 18min", color: "#06B6D4" },
            ].map((stat) => (
              <div
                key={stat.title}
                className="bg-[#111113] border border-white/10 rounded-lg p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-mono">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold">{stat.value}</span>
                    </div>
                  </div>
                  <MiniBars color={stat.color} />
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  <stat.icon className="w-3 h-3 text-[#6B7280]" />
                  <span className="text-xs text-[#22C55E]">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Deliberations Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-3 bg-[#111113] border border-white/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    Deliberações por Mês
                  </h2>
                  <Info className="w-3 h-3 text-[#6B7280]" />
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-[#6B7280]">Total 2025:</span>
                    <span className="text-2xl font-bold">574</span>
                  </div>
                  <div className="flex items-center gap-4 ml-8">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      <span className="text-xs text-[#6B7280] uppercase">Deferidas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span className="text-xs text-[#6B7280] uppercase">Indeferidas</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={1} barCategoryGap="15%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar
                      dataKey="deferidas"
                      stackId="a"
                      fill="#22C55E"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="indeferidas"
                      stackId="a"
                      fill="#EF4444"
                      fillOpacity={0.7}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Jurimetria Side Card */}
            <div className="bg-[#111113] border border-white/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Jurimetria
                </h3>
              </div>
              <p className="text-xs text-[#6B7280] mb-4">Padrões de votação por diretor</p>
              <div className="space-y-4">
                {[
                  { nome: "Dir. Silva", taxa: 92, votos: 48 },
                  { nome: "Dir. Santos", taxa: 85, votos: 41 },
                  { nome: "Dir. Oliveira", taxa: 78, votos: 36 },
                  { nome: "Dir. Lima", taxa: 88, votos: 44 },
                ].map((dir) => (
                  <div key={dir.nome}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#A1A1AA]">{dir.nome}</span>
                      <span>{dir.taxa}% ({dir.votos})</span>
                    </div>
                    <div className="h-1.5 bg-[#1A1A1F] rounded-full overflow-hidden">
                      <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${dir.taxa}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 bg-[#1A1A1F] rounded-lg">
                <p className="text-[10px] text-[#6B7280] uppercase mb-1">Índice de Unanimidade</p>
                <p className="text-2xl font-bold text-[#8B5CF6]">73,4%</p>
                <p className="text-xs text-[#6B7280] mt-1">das deliberações foram unânimes</p>
              </div>
            </div>
          </div>

          {/* Recent Deliberations Table */}
          <div className="bg-[#111113] border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Últimas Deliberações
                </h2>
                <Info className="w-3 h-3 text-[#6B7280]" />
              </div>
              <div className="flex items-center gap-2 bg-[#1A1A1F] border border-white/10 rounded-lg px-3 py-2 w-56">
                <Search className="w-3 h-3 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Buscar deliberações..."
                  className="bg-transparent text-xs outline-none flex-1 text-white placeholder-[#6B7280] font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[#6B7280] uppercase tracking-wider border-b border-white/5">
                    <th className="text-left py-3 pr-4">
                      <span className="flex items-center gap-1">
                        ID <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="text-left py-3 pr-4">
                      <span className="flex items-center gap-1">
                        Tipo <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="text-left py-3 pr-4">
                      <span className="flex items-center gap-1">
                        Empresa <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="text-left py-3 pr-4">
                      <span className="flex items-center gap-1">
                        Decisão <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="text-left py-3 pr-4">
                      <span className="flex items-center gap-1">
                        Relator <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="text-left py-3">
                      <span className="flex items-center gap-1">
                        Data <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliberacoes.map((del) => (
                    <tr
                      key={del.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4 text-sm text-[#8B5CF6]">{del.id}</td>
                      <td className="py-3 pr-4 text-sm">{del.tipo}</td>
                      <td className="py-3 pr-4 text-sm text-[#A1A1AA]">{del.empresa}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                            del.decisao === "Deferido"
                              ? "text-[#22C55E] bg-[#22C55E]/10"
                              : "text-[#EF4444] bg-[#EF4444]/10"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {del.decisao}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-[#A1A1AA]">{del.diretor}</td>
                      <td className="py-3 text-sm text-[#6B7280]">{del.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
