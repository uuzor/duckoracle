'use client';

import { Market, Page } from '../DuckOracleApp';
import { WalletConnect } from '../WalletConnect';

interface MarketsProps {
  markets: Market[];
  onMarketClick: (market: Market) => void;
  onNavigate: (page: Page) => void;
  onCreateMarket?: () => void;
}

export function Markets({ markets, onMarketClick, onNavigate, onCreateMarket }: MarketsProps) {
  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-gray-900">
      <div className="flex flex-col">
        <header className="bg-gray-800 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center p-4">
            <button 
              onClick={() => onCreateMarket?.() || onNavigate('create')}
              className="text-gray-400 hover:text-white"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <h1 className="text-xl font-bold text-white flex-1 text-center">DuckOracle</h1>
            <WalletConnect />
          </div>
          <div className="px-4 pb-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">search</span>
              <input 
                className="w-full rounded-full border-gray-600 bg-gray-700 pl-10 pr-4 py-2 text-base text-white placeholder:text-gray-400 focus:ring-[#ea2a33] focus:border-[#ea2a33]" 
                placeholder="Search markets (e.g. BTC, elections)" 
                type="search"
              />
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 space-y-4">
          {markets.map((market) => (
            <div 
              key={market.id}
              onClick={() => onMarketClick(market)}
              className="bg-gray-800 rounded-2xl shadow-md p-4 space-y-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-lg">{market.question}</p>
                <div className="flex items-center gap-1 text-gray-400">
                  <span className="material-symbols-outlined text-sm">timer</span>
                  <span className="text-sm font-medium">{market.timeLeft}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-between p-3 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                  <span className="font-bold">YES</span>
                  <span className="font-bold text-lg">{(1/market.yesPrice).toFixed(1)}x</span>
                </button>
                <button className="flex items-center justify-between p-3 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
                  <span className="font-bold">NO</span>
                  <span className="font-bold text-lg">{(1/market.noPrice).toFixed(1)}x</span>
                </button>
              </div>
            </div>
          ))}
        </main>
      </div>

      <footer className="sticky bottom-0 bg-gray-800 border-t border-gray-700 shadow-t-md z-10">
        <nav className="flex justify-around py-2">
          <button 
            onClick={() => onNavigate('markets')}
            className="flex flex-col items-center justify-center gap-1 text-[#ea2a33]"
          >
            <span className="material-symbols-outlined">store</span>
            <span className="text-xs font-bold">Markets</span>
          </button>
          <button 
            onClick={() => onNavigate('portfolio')}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#ea2a33] transition-colors"
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-xs font-medium">Portfolio</span>
          </button>
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#ea2a33] transition-colors"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-xs font-medium">Account</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}