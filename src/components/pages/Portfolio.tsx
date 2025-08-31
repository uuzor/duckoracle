'use client';

import { Page } from '../DuckOracleApp';

interface PortfolioProps {
  onNavigate: (page: Page) => void;
}

export function Portfolio({ onNavigate }: PortfolioProps) {
  const positions = [
    { id: 1, question: "Will BTC hit $100K by end of month?", outcome: "YES", shares: 50, value: 27.5 },
    { id: 2, question: "Will ETH reach $5,000 by year-end?", outcome: "NO", shares: 25, value: 4.25 },
  ];

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-gray-900">
      <div className="flex flex-col">
        <header className="flex items-center p-4 justify-between sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10">
          <button 
            onClick={() => onNavigate('markets')}
            className="text-gray-400 flex size-10 shrink-0 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-white text-lg font-bold">Portfolio</h1>
          <div className="size-10"></div>
        </header>

        <main className="flex-1 px-4 pt-4">
          <div className="mb-6 rounded-2xl bg-gray-800 p-6 text-center shadow-sm border border-gray-700">
            <p className="text-sm font-medium text-gray-400">Total Portfolio Value</p>
            <p className="text-4xl font-bold text-white mt-2">
              31.75 <span className="text-2xl font-semibold text-gray-400">$DUCK</span>
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <div className="text-center">
                <p className="text-green-600 font-bold">+5.2%</p>
                <p className="text-xs text-slate-500">24h Change</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold">2</p>
                <p className="text-xs text-gray-400">Active Positions</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white text-xl font-bold">Your Positions</h3>
            {positions.map((position) => (
              <div key={position.id} className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white font-semibold text-sm flex-1 pr-2">
                    {position.question}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    position.outcome === 'YES' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {position.outcome}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">{position.shares} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{position.value} $DUCK</p>
                    <p className="text-green-600 text-sm">+12.5%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-white text-xl font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Bought YES shares</p>
                    <p className="text-gray-400 text-xs">BTC $100K market</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">50 shares</p>
                  <p className="text-gray-400 text-xs">2h ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Claimed winnings</p>
                    <p className="text-gray-400 text-xs">Election market</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-bold">+125 $DUCK</p>
                  <p className="text-gray-400 text-xs">1d ago</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="sticky bottom-0 border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm pb-safe">
        <nav className="flex items-center justify-around px-4 pt-2 pb-3">
          <button 
            onClick={() => onNavigate('markets')}
            className="flex flex-col items-center justify-end gap-1 text-gray-400"
          >
            <span className="material-symbols-outlined text-2xl">leaderboard</span>
            <span className="text-xs font-medium">Markets</span>
          </button>
          <button 
            onClick={() => onNavigate('portfolio')}
            className="flex flex-col items-center justify-end gap-1 text-[#ea2a33]"
          >
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            <span className="text-xs font-bold">Portfolio</span>
          </button>
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center justify-end gap-1 text-gray-400"
          >
            <span className="material-symbols-outlined text-2xl">account_circle</span>
            <span className="text-xs font-medium">Account</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}