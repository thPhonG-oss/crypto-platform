import React from "react";
import MarketDashboard from "./components/MarketDashboard";

function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-10">
        Crypto Market Dashboard
      </h1>

      <div className="w-full max-w-6xl">
        <MarketDashboard />
      </div>
    </div>
  );
}

export default App;
