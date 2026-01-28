import React, { useState, useEffect } from "react";
import NewsPanel from "./components/NewsPanel";
import EnhancedCryptoChart from "./components/EnhancedCryptoChart";
import MultiChartGrid from "./components/MultiChartGrid";
import {
  LoginModal,
  RegisterModal,
  UserMenu,
  AuthButtons,
} from "./components/auth";
import { useAuth } from "./context/AuthContext";
import { useWebSocket } from "./context/WebSocketContext";
import { CONFIG } from "./config";
import { checkServiceHealth } from "./utils/helper";
import {
  TrendingUp,
  Wifi,
  WifiOff,
  LayoutGrid,
  BarChart3,
  Newspaper,
  Zap,
  Grid2X2,
  Grid3x3,
} from "lucide-react";

const AVAILABLE_SYMBOLS = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "₿" },
  { symbol: "ETHUSDT", name: "Ethereum", icon: "Ξ" },
  { symbol: "BNBUSDT", name: "BNB", icon: "◆" },
  { symbol: "SOLUSDT", name: "Solana", icon: "◎" },
];

const TIMEFRAMES = [
  { value: "1m", label: "1M" },
  { value: "5m", label: "5M" },
  { value: "15m", label: "15M" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

const LAYOUT_MODES = [
  { id: "split", icon: LayoutGrid, label: "Split View" },
  { id: "chart-only", icon: BarChart3, label: "Chart Only" },
  { id: "grid-2x2", icon: Grid2X2, label: "Grid 2x2" },
  { id: "grid-1x4", icon: Grid3x3, label: "Grid 1x4" },
  { id: "news-only", icon: Newspaper, label: "News Only" },
];

function App() {
  const { isAuthenticated } = useAuth();
  const { isConnected: wsConnected } = useWebSocket();

  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [layoutMode, setLayoutMode] = useState("split");
  const [isConnected, setIsConnected] = useState(false);

  // Auth modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const openLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const openRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  // Check system health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const market = await checkServiceHealth(
        `${CONFIG.API.MARKET_SERVICE}/actuator`,
      );
      setIsConnected(market);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const selectedSymbolData = AVAILABLE_SYMBOLS.find(
    (s) => s.symbol === selectedSymbol,
  );

  const isGridMode = layoutMode === "grid-2x2" || layoutMode === "grid-1x4";

  return (
    <div className="min-h-screen bg-bg-primary text-gray-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-primary">
        <div className="max-w-[1800px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">CryptoNexus</h1>
                <div className="flex items-center gap-1.5">
                  {wsConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-accent-primary" />
                      <span className="text-[10px] text-accent-primary font-medium">
                        LIVE
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-medium">
                        OFFLINE
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Center - Symbol Tabs (Hide in grid mode) */}
            {!isGridMode && (
              <div className="hidden md:flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
                {AVAILABLE_SYMBOLS.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedSymbol === item.symbol
                        ? "bg-accent-primary text-white"
                        : "text-gray-400 hover:text-white hover:bg-bg-card"
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            {/* Right - Controls & Auth */}
            <div className="flex items-center gap-3">
              {/* Timeframe Pills */}
              <div className="hidden sm:flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      selectedTimeframe === tf.value
                        ? "bg-accent-secondary text-white"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Layout Toggle */}
              <div className="hidden lg:flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
                {LAYOUT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setLayoutMode(mode.id)}
                      className={`p-2 rounded-md transition-all ${
                        layoutMode === mode.id
                          ? "bg-bg-card text-accent-primary"
                          : "text-gray-500 hover:text-white"
                      }`}
                      title={mode.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-border-primary" />

              {/* Auth */}
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <AuthButtons
                  onLoginClick={openLogin}
                  onRegisterClick={openRegister}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Symbol Selector (Hide in grid mode) */}
      {!isGridMode && (
        <div className="md:hidden p-4 border-b border-border-primary">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {AVAILABLE_SYMBOLS.map((item) => (
              <button
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedSymbol === item.symbol
                    ? "bg-accent-primary text-white"
                    : "bg-bg-card text-gray-400 border border-border-primary"
                }`}
              >
                {item.icon} {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-4 lg:p-6">
        {/* Current Symbol Header (Hide in grid mode) */}
        {!isGridMode && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-border-secondary flex items-center justify-center text-2xl">
                {selectedSymbolData?.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedSymbolData?.name}
                </h2>
                <p className="text-sm text-gray-500">{selectedSymbol}</p>
              </div>
            </div>

            {/* Mobile Timeframe */}
            <div className="sm:hidden">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-sm text-white"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* GRID MODE - Multi-Chart View */}
        {isGridMode && (
          <MultiChartGrid
            timeframe={selectedTimeframe}
            gridColumns={layoutMode === "grid-1x4" ? 4 : 2}
            onSymbolClick={(symbol) => {
              setSelectedSymbol(symbol);
              setLayoutMode("split");
            }}
          />
        )}

        {/* SINGLE/SPLIT/NEWS MODES */}
        {!isGridMode && (
          <div
            className={`grid gap-6 ${
              layoutMode === "split"
                ? "lg:grid-cols-[1fr,400px]"
                : "grid-cols-1"
            }`}
          >
            {/* Chart Section */}
            {(layoutMode === "split" || layoutMode === "chart-only") && (
              <div className="card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border-primary flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent-primary" />
                    <span className="font-semibold text-white">
                      {selectedSymbol} Chart
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
                <div className="h-[500px] lg:h-[600px]">
                  <EnhancedCryptoChart
                    symbol={selectedSymbol}
                    timeframe={selectedTimeframe}
                    height={600}
                  />
                </div>
              </div>
            )}

            {/* News Section */}
            {(layoutMode === "split" || layoutMode === "news-only") && (
              <div className="card rounded-2xl overflow-hidden flex flex-col h-[600px] lg:h-[680px]">
                <div className="p-4 border-b border-border-primary flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent-warning" />
                    <span className="font-semibold text-white">Live Feed</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <NewsPanel selectedSymbol={selectedSymbol} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={openRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={openLogin}
      />
    </div>
  );
}

export default App;
