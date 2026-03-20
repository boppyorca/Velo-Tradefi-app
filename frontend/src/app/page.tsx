import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  TrendingUp,
  Brain,
  Wallet,
  Newspaper,
  Zap,
  ArrowRight,
  BarChart3,
  Shield,
  Globe,
} from "lucide-react";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("velo_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-velo-lime rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#0A0A0C] font-bold fill-current" />
          </div>
          <span className="text-velo-lime font-black tracking-tighter text-xl">VELO</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[#8A8A9A] hover:text-white transition-colors font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="h-9 px-5 bg-velo-lime hover:bg-velo-lime/90 text-[#0A0A0C] font-semibold text-sm rounded-xl flex items-center gap-2 transition-colors"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-velo-lime-dim border border-velo-lime/20 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-velo-lime rounded-full animate-pulse" />
            <span className="text-[11px] font-medium text-velo-lime tracking-wide uppercase">
              AI-Powered Market Intelligence
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Trade smarter.
            <br />
            <span className="text-velo-lime">Predict better.</span>
          </h1>

          <p className="text-lg text-[#8A8A9A] leading-relaxed max-w-xl mb-10">
            Real-time VN & US stock tracking, AI-powered price forecasting with LSTM & Prophet, 
            Web3 wallet integration, and memecoin intelligence — all in one terminal.
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <Link
              href="/register"
              className="h-12 px-7 bg-velo-lime hover:bg-velo-lime/90 text-[#0A0A0C] font-bold text-sm rounded-xl flex items-center gap-2.5 transition-all active:scale-[0.98]"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="h-12 px-7 bg-transparent border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] text-white font-medium text-sm rounded-xl flex items-center gap-2 transition-all"
            >
              Sign in
            </Link>
          </div>

          {/* Market ticker strip */}
          <div className="flex flex-wrap gap-6">
            {[
              { symbol: "NVDA", price: "135.21", change: "+2.4%", up: true },
              { symbol: "AAPL", price: "192.10", change: "+0.8%", up: true },
              { symbol: "VNM", price: "78.500", change: "-1.2%", up: false },
              { symbol: "BTC", price: "67.420", change: "+3.1%", up: true },
              { symbol: "TSLA", price: "248.50", change: "-0.5%", up: false },
            ].map((m) => (
              <div
                key={m.symbol}
                className="px-4 py-2.5 rounded-xl bg-[#141418] border border-[rgba(255,255,255,0.07)]"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[#8A8A9A] tracking-wider">{m.symbol}</span>
                  <span className="text-[10px] font-mono text-velo-lime/60">NYSE</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono font-bold text-white">${m.price}</span>
                  <span className={`text-xs font-mono font-medium ${m.up ? "text-velo-lime" : "text-velo-red"}`}>
                    {m.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <div className="mb-12">
          <h2 className="text-3xl font-black tracking-tight mb-3">Everything you need</h2>
          <p className="text-[#8A8A9A]">Five modules, one terminal. Built for serious traders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.07)] px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-velo-lime rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-[#0A0A0C] fill-current" />
            </div>
            <span className="text-velo-lime font-black text-sm tracking-tight">VELO</span>
          </div>
          <p className="text-xs text-[#4A4A5A]">
            Đồ án môn Lập trình Web · Nhóm 2–3 người · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: BarChart3,
    color: "velo-lime",
    title: "Stock Tracking",
    desc: "Real-time VN (HOSE, HNX) & US (NYSE, NASDAQ) prices with 30-second refresh.",
    accent: "border-velo-lime/20",
    tag: "Core",
  },
  {
    icon: Brain,
    color: "velo-indigo",
    title: "AI Prediction",
    desc: "7-day price forecasting powered by LSTM neural networks + Prophet statistical models.",
    accent: "border-velo-indigo/20",
    tag: "Core",
  },
  {
    icon: Wallet,
    color: "velo-purple",
    title: "Web3 Wallet",
    desc: "MetaMask integration for ETH & ERC-20 balances. No custody, just connection.",
    accent: "border-velo-purple/20",
    tag: "Bonus",
  },
  {
    icon: TrendingUp,
    color: "velo-lime",
    title: "Memecoin Tracker",
    desc: "Top 50 memecoins live via CoinGecko. Personalized watchlist with 7d/30d charts.",
    accent: "border-velo-lime/20",
    tag: "Bonus",
  },
  {
    icon: Newspaper,
    color: "velo-amber",
    title: "AI News Feed",
    desc: "Aggregated AI & tech news via RSS. Stay informed without leaving the terminal.",
    accent: "border-velo-amber/20",
    tag: "Secondary",
  },
  {
    icon: Shield,
    color: "velo-indigo",
    title: "Secure by Design",
    desc: "JWT authentication, Supabase Realtime, and SignalR for secure data delivery.",
    accent: "border-velo-indigo/20",
    tag: "Infrastructure",
  },
];

function FeatureCard({
  icon: Icon,
  color,
  title,
  desc,
  accent,
  tag,
}: (typeof FEATURES)[0]) {
  const colorMap: Record<string, string> = {
    "velo-lime": "text-velo-lime",
    "velo-indigo": "text-velo-indigo",
    "velo-purple": "text-velo-purple",
    "velo-amber": "text-velo-amber",
    "velo-red": "text-velo-red",
  };

  return (
    <div
      className={`group p-6 rounded-2xl bg-[#141418] border ${accent} hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-[#1E1E26] flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colorMap[color]}`} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A4A5A] mt-1">
          {tag}
        </span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#8A8A9A] leading-relaxed">{desc}</p>
    </div>
  );
}
