"use client";

import * as React from "react";
import {
  Search,
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  MessageSquare,
  Users,
  Target,
  UserCircle,
  MessageCircle,
  ClipboardList,
  Shield,
  CreditCard,
  Plug,
  HeadphonesIcon,
  HelpCircle,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Info,
  Eye,
  CheckCircle,
  ArrowUpDown,
  Sparkles,
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
  { icon: Package, label: "Products" },
  { icon: Receipt, label: "Transactions" },
  { icon: BarChart3, label: "Reports & Analytics" },
  { icon: MessageSquare, label: "Messages" },
  { icon: Users, label: "Team Performance" },
  { icon: Target, label: "Campaigns" },
];

const customers = [
  { icon: UserCircle, label: "Customer List" },
  { icon: MessageCircle, label: "Channels" },
  { icon: ClipboardList, label: "Order Management" },
];

const management = [
  { icon: Shield, label: "Roles & Permissions" },
  { icon: CreditCard, label: "Billing & Subscription" },
  { icon: Plug, label: "Integrations" },
];

const settings = [
  { icon: HeadphonesIcon, label: "Customer Support" },
  { icon: HelpCircle, label: "Help Center" },
  { icon: Settings, label: "System Settings" },
];

/* ───────── Chart Data ───────── */
const monthlyData = [
  { month: "JAN", newUser: 8000, existingUser: 3000 },
  { month: "FEB", newUser: 12000, existingUser: 4000 },
  { month: "MAR", newUser: 15000, existingUser: 5000 },
  { month: "APR", newUser: 20000, existingUser: 6000 },
  { month: "MAY", newUser: 35000, existingUser: 8000 },
  { month: "JUN", newUser: 38000, existingUser: 18000 },
  { month: "JUL", newUser: 42000, existingUser: 12000 },
  { month: "AUG", newUser: 48000, existingUser: 15000 },
  { month: "SEP", newUser: 52000, existingUser: 18000 },
  { month: "OCT", newUser: 55000, existingUser: 20000 },
  { month: "NOV", newUser: 60000, existingUser: 22000 },
  { month: "DEC", newUser: 50000, existingUser: 16000 },
];

/* ───────── Transactions Data ───────── */
const transactions = [
  { id: "#04910", customer: "Ryan Korsgaard", product: "Ergo Office Chair", status: "Success", qty: 12, price: "$3,450" },
  { id: "#04911", customer: "Alfredo Passaquindici Arcand", product: "Wireless Mouse", status: "Success", qty: 45, price: "$1,200" },
  { id: "#04912", customer: "Cristofer Rosser", product: "Mechanical Keyboard", status: "Pending", qty: 8, price: "$890" },
  { id: "#04913", customer: "Maria Saris", product: "USB-C Hub", status: "Success", qty: 32, price: "$2,100" },
  { id: "#04914", customer: "James Donin", product: "Monitor Stand", status: "Failed", qty: 5, price: "$450" },
];

/* ───────── Stat Card Mini Bars ───────── */
function MiniBars({ color = "#FF6B2C" }: { color?: string }) {
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
            style={{ backgroundColor: i === 0 ? "#FF6B2C" : "#FF6B2C" }}
          />
          <span className="text-[#A1A1AA]">
            {p.dataKey === "newUser" ? "New User" : "Existing User"}
          </span>
          <span className="text-white font-bold ml-auto">
            {(p.value / 1000).toFixed(0)}k
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
              ? "text-[#FF6B2C] bg-[#FF6B2C]/10"
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
      <aside className="w-[260px] bg-[#0F0F12] border-r border-white/5 flex flex-col overflow-y-auto shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B2C]/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#FF6B2C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#6B7280]">Agency</p>
              <p className="text-sm font-bold truncate">Spark Pixel Team</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>

        <div className="flex-1 p-2 overflow-y-auto">
          <SidebarSection title="Main Menu" items={mainMenu} />
          <SidebarSection title="Customers" items={customers} />
          <SidebarSection title="Management" items={management} />
          <SidebarSection title="Settings" items={settings} />
        </div>

        {/* Sidebar Background Art */}
        <div className="h-40 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/60 to-transparent" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-[#09090B]/80 backdrop-blur-sm border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280]">Dashboard</span>
              <span className="text-[#6B7280]">&gt;</span>
              <span className="text-[#FF6B2C]">Overview</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#111113] border border-white/10 rounded-lg px-3 py-2 w-64">
                <Search className="w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-sm outline-none flex-1 text-white placeholder-[#6B7280] font-mono"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Welcome */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Welcome back, Salung</h1>
            <button className="flex items-center gap-2 bg-[#111113] border border-white/10 rounded-lg px-4 py-2 text-sm text-white">
              Daily <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "TOTAL REVENUE", value: "$20,320", sub: "", change: "+0,94% last year" },
              { title: "TOTAL ORDERS", value: "10,320", sub: "Orders", change: "+0,12% last year" },
              { title: "NEW CUSTOMERS", value: "4,305", sub: "New Users", change: "+0,93% last year" },
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
                      {stat.sub && (
                        <span className="text-sm text-[#6B7280]">{stat.sub}</span>
                      )}
                    </div>
                  </div>
                  <MiniBars />
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  <Info className="w-3 h-3 text-[#6B7280]" />
                  <span className="text-xs text-[#22C55E]">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sales Trend Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-3 bg-[#111113] border border-white/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    Sales Trend
                  </h2>
                  <Info className="w-3 h-3 text-[#6B7280]" />
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-[#6B7280]">Total Revenue :</span>
                    <span className="text-2xl font-bold">$20,320</span>
                  </div>
                  <div className="flex items-center gap-4 ml-8">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF6B2C]/40" />
                      <span className="text-xs text-[#6B7280] uppercase">New User</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF6B2C]" />
                      <span className="text-xs text-[#6B7280] uppercase">Existing User</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-[#1A1A1F] rounded-lg overflow-hidden">
                  {["Weekly", "Monthly", "Yearly"].map((period) => (
                    <button
                      key={period}
                      className={`px-4 py-1.5 text-xs font-mono ${
                        period === "Monthly"
                          ? "bg-white text-black"
                          : "text-[#6B7280] hover:text-white"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
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
                      tickFormatter={(v: number) => `${v / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar
                      dataKey="existingUser"
                      stackId="a"
                      fill="#FF6B2C"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="newUser"
                      stackId="a"
                      fill="#FF6B2C"
                      fillOpacity={0.35}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Side Card */}
            <div className="bg-[#111113] border border-white/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Revenue
                </h3>
              </div>
              <div className="text-3xl font-bold mb-1">$20,320</div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 bg-[#1A1A1F] rounded-lg p-3 cursor-pointer hover:bg-[#222228] transition-colors">
                  <Sparkles className="w-4 h-4 text-[#FF6B2C]" />
                  <span className="text-xs">Get AI Insights</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#6B7280]">Target</span>
                    <span>$25,000</span>
                  </div>
                  <div className="h-1.5 bg-[#1A1A1F] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF6B2C] rounded-full" style={{ width: "81%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#6B7280]">Last Month</span>
                    <span>$18,500</span>
                  </div>
                  <div className="h-1.5 bg-[#1A1A1F] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF6B2C]/50 rounded-full" style={{ width: "74%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#111113] border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Recent Transactions
                </h2>
                <Info className="w-3 h-3 text-[#6B7280]" />
              </div>
              <div className="flex items-center gap-2 bg-[#1A1A1F] border border-white/10 rounded-lg px-3 py-2 w-56">
                <Search className="w-3 h-3 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="bg-transparent text-xs outline-none flex-1 text-white placeholder-[#6B7280] font-mono"
                />
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-[#6B7280] uppercase tracking-wider border-b border-white/5">
                  <th className="text-left py-3 pr-4 w-8">
                    <input type="checkbox" className="rounded border-white/20 accent-[#FF6B2C]" />
                  </th>
                  <th className="text-left py-3 pr-4">
                    <span className="flex items-center gap-1">
                      ID <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left py-3 pr-4">
                    <span className="flex items-center gap-1">
                      Customer <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left py-3 pr-4">
                    <span className="flex items-center gap-1">
                      Product <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left py-3 pr-4">
                    <span className="flex items-center gap-1">
                      Status <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left py-3 pr-4">
                    <span className="flex items-center gap-1">
                      Qty <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left py-3">
                    <span className="flex items-center gap-1">
                      Unit Price <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <input type="checkbox" className="rounded border-white/20 accent-[#FF6B2C]" />
                    </td>
                    <td className="py-3 pr-4 text-sm">{tx.id}</td>
                    <td className="py-3 pr-4 text-sm">{tx.customer}</td>
                    <td className="py-3 pr-4 text-sm text-[#A1A1AA]">{tx.product}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                          tx.status === "Success"
                            ? "text-[#22C55E]"
                            : tx.status === "Pending"
                            ? "text-[#F59E0B]"
                            : "text-[#EF4444]"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-center">{tx.qty}</td>
                    <td className="py-3 text-sm">{tx.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
