import React, { useState, useEffect } from "react";
import MarketDashboard from "./components/MarketDashboard";
import NewsPanel from "./components/NewsPanel";
import CryptoChart from "./components/CryptoChart";
import { CONFIG } from "./config";
import { checkServiceHealth } from "./utils/helper";
import { Activity, Server, Database, Globe, Sparkles } from "lucide-react";

const AVAILABLE_SYMBOLS = [
  { symbol: "BTCUSDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", name: "Ethereum" },
  { symbol: "BNBUSDT", name: "BNB" },
  { symbol: "SOLUSDT", name: "Solana" },
];

const TIMEFRAMES = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
];

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [layoutMode, setLayoutMode] = useState("split");
  const [systemStatus, setSystemStatus] = useState({
    gateway: false,
    market: false,
    crawler: false,
    analysis: false,
  });

  // Check system health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const gateway = await checkServiceHealth(
        `${CONFIG.API.GATEWAY}/actuator`,
      );
      const market = await checkServiceHealth(
        `${CONFIG.API.MARKET_SERVICE}/actuator`,
      );
      // Crawler service has a custom /health endpoint, others use Spring Actuator
      const crawler = await checkServiceHealth(CONFIG.API.CRAWLER_SERVICE);
      const analysis = await checkServiceHealth(CONFIG.API.ANALYSIS_SERVICE);

      setSystemStatus({
        gateway,
        market,
        crawler,
        analysis,
      });
    };

    checkHealth();
    // Re-check every minute
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-deep-bg text-gray-100 font-sans selection:bg-neon-blue/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 relative z-10">
        {/* Header */}
        <header className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between animate-[float_6s_ease-in-out_infinite] border-t border-neon-blue/20">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 text-glow">
              Crypto{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-neon-blue to-neon-purple">
                Nexus
              </span>
            </h1>
            <p className="text-gray-400 flex items-center gap-2 text-sm md:text-base font-medium">
              <Activity className="w-4 h-4 text-neon-blue animate-pulse" />
              <span className="text-gray-300">Live Market Intelligence</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
            {/* Timeframe Selector */}
            <div className="relative group">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="appearance-none bg-gray-900/80 text-white px-6 py-3 pr-10 rounded-xl border border-gray-700/50 focus:border-neon-blue/50 focus:ring-0 focus:shadow-[0_0_15px_-5px_var(--color-neon-blue)] transition-all cursor-pointer outline-none hover:bg-gray-800"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neon-blue group-hover:text-white transition-colors">
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Layout Toggles */}
            <div className="flex bg-gray-900/80 p-1.5 rounded-xl border border-gray-700/50 backdrop-blur-md">
              {[
                { id: "split", icon: "📊📰", label: "Split" },
                { id: "chart-only", icon: "📊", label: "Chart" },
                { id: "news-only", icon: "📰", label: "News" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setLayoutMode(mode.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    layoutMode === mode.id
                      ? "bg-linear-to-r from-neon-blue/20 to-neon-purple/20 text-white shadow-[0_0_10px_-2px_var(--color-neon-blue)] border border-neon-blue/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                  title={mode.label}
                >
                  {mode.icon}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Symbol Tabs */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pt-2">
          {AVAILABLE_SYMBOLS.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setSelectedSymbol(item.symbol)}
              className={`shrink-0 px-8 py-4 rounded-xl font-bold transition-all relative overflow-hidden group border ${
                selectedSymbol === item.symbol
                  ? "bg-gray-900/80 text-white border-neon-blue shadow-[0_0_20px_-5px_var(--color-neon-blue)] translate-y-[-2px]"
                  : "bg-gray-900/40 text-gray-500 border-white/5 hover:border-white/20 hover:text-gray-300 hover:bg-gray-800/60"
              }`}
            >
              {/* Animated Background Line */}
              {selectedSymbol === item.symbol && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-linear-to-r from-neon-blue via-white to-neon-blue animate-[shimmer_2s_infinite]" />
              )}

              <div className="flex flex-col items-center">
                <span
                  className={`text-base tracking-wide ${selectedSymbol === item.symbol ? "text-glow" : ""}`}
                >
                  {item.name}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] mt-1 ${selectedSymbol === item.symbol ? "text-neon-blue" : "text-gray-600 group-hover:text-gray-400"}`}
                >
                  {item.symbol}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <main
          className="grid gap-8 items-start transition-all duration-500 ease-out"
          style={{
            gridTemplateColumns: layoutMode === "split" ? "2fr 1fr" : "1fr",
            minHeight: "600px",
          }}
        >
          {/* Chart Section */}
          {(layoutMode === "split" || layoutMode === "chart-only") && (
            <div className="glass-panel rounded-2xl p-1 border-t border-neon-purple/30 overflow-hidden relative group">
              <div className="absolute inset-0 bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen" />
              <CryptoChart
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
              />
            </div>
          )}

          {/* News Section */}
          {(layoutMode === "split" || layoutMode === "news-only") && (
            <div className="glass-panel rounded-2xl p-4 h-[600px] flex flex-col border-t border-neon-pink/30 relative">
              <div className="absolute -top-1 -right-1 w-20 h-20 bg-neon-pink/20 blur-[40px] rounded-full pointer-events-none" />
              <NewsPanel selectedSymbol={selectedSymbol} />
            </div>
          )}
        </main>

        {/* System Status Footer */}
        <footer className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-8 border-t border-gray-800/50">
          <StatCard
            title="Gateway"
            value={systemStatus.gateway ? "Online" : "Connecting..."}
            status={systemStatus.gateway ? "success" : "warning"}
            icon={<Globe className="w-4 h-4" />}
          />
          <StatCard
            title="Market Data"
            value={systemStatus.market ? "Connected" : "Offline"}
            status={systemStatus.market ? "success" : "error"}
            icon={<Activity className="w-4 h-4" />}
          />
          <StatCard
            title="Crawler"
            value={systemStatus.crawler ? "Active" : "Starting"}
            status={systemStatus.crawler ? "success" : "warning"}
            icon={<Server className="w-4 h-4" />}
            animate={systemStatus.crawler}
          />
          <StatCard
            title="AI Analysis"
            value={systemStatus.analysis ? "Online" : "Offline"}
            status={systemStatus.analysis ? "success" : "error"}
            icon={<Sparkles className="w-4 h-4" />}
            animate={systemStatus.analysis}
          />
          <StatCard
            title="Database"
            value="TimescaleDB"
            status="success"
            icon={<Database className="w-4 h-4" />}
          />
        </footer>
      </div>

      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/10 blur-[120px] rounded-full animate-float opacity-60" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full animate-float opacity-60"
          style={{ animationDelay: "-3s" }}
        />
      </div>
    </div>
  );
}

// Stats Card Component
const StatCard = ({
  title,
  value,
  icon,
  status = "neutral",
  animate = false,
}) => {
  const statusColors = {
    success:
      "text-neon-blue border-neon-blue/30 bg-neon-blue/5 shadow-[0_0_10px_-5px_var(--color-neon-blue)]",
    warning: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    error:
      "text-neon-pink border-neon-pink/30 bg-neon-pink/5 shadow-[0_0_10px_-5px_var(--color-neon-pink)]",
    neutral: "text-gray-400 border-gray-700 bg-gray-800/50",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] ${statusColors[status]}`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-gray-900/50 backdrop-blur-sm ${animate ? "animate-pulse" : ""}`}
          >
            {icon}
          </div>
          <div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              {title}
            </p>
            <p className="text-gray-200 text-sm font-bold mt-0.5">{value}</p>
          </div>
        </div>
        {status === "success" && (
          <div className="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_10px_var(--color-neon-blue)] animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default App;
