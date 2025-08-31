'use client';

import { useState } from 'react';
import { Market, Page } from '../DuckOracleApp';

interface MarketDetailsProps {
  market: Market;
  onBet: (outcome: boolean) => void;
  onNavigate: (page: Page) => void;
}

export function MarketDetails({ market, onBet, onNavigate }: MarketDetailsProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<boolean>(true);
  const [stakeAmount, setStakeAmount] = useState('');

  const handleStake = () => {
    if (stakeAmount) {
      onBet(selectedOutcome);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#fcf8f8]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#fcf8f8] p-4 pb-2">
        <button 
          onClick={() => onNavigate('markets')}
          className="text-[#1b0e0e]"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-[#1b0e0e]">Market Details</h1>
      </header>

      <main className="flex-1 p-4">
        <section className="mb-6">
          <h2 className="mb-4 text-2xl font-bold text-[#1b0e0e]">{market.question}</h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-[#f3e7e8] p-3">
              <p className="text-2xl font-bold text-[#1b0e0e]">15</p>
              <p className="text-xs text-[#994d51]">Days</p>
            </div>
            <div className="rounded-xl bg-[#f3e7e8] p-3">
              <p className="text-2xl font-bold text-[#1b0e0e]">8</p>
              <p className="text-xs text-[#994d51]">Hours</p>
            </div>
            <div className="rounded-xl bg-[#f3e7e8] p-3">
              <p className="text-2xl font-bold text-[#1b0e0e]">45</p>
              <p className="text-xs text-[#994d51]">Minutes</p>
            </div>
            <div className="rounded-xl bg-[#f3e7e8] p-3">
              <p className="text-2xl font-bold text-[#1b0e0e]">30</p>
              <p className="text-xs text-[#994d51]">Seconds</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-4 text-xl font-bold text-[#1b0e0e]">AI Agent Predictions</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#f3e7e8] p-4">
              <div className="mb-2 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                <div>
                  <p className="text-base font-bold text-[#1b0e0e]">Agent Alpha</p>
                  <p className="text-sm font-medium text-[#994d51]">Confidence: 85%</p>
                </div>
              </div>
              <p className="text-sm text-[#1b0e0e]">
                Agent Alpha predicts a high probability of success, citing strong network growth and upcoming protocol upgrades.
              </p>
            </div>
            <div className="rounded-xl border border-[#f3e7e8] p-4">
              <div className="mb-2 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500"></div>
                <div>
                  <p className="text-base font-bold text-[#1b0e0e]">Agent Beta</p>
                  <p className="text-sm font-medium text-[#994d51]">Confidence: 60%</p>
                </div>
              </div>
              <p className="text-sm text-[#1b0e0e]">
                Agent Beta is cautiously optimistic, noting potential market volatility and regulatory uncertainties.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-4 text-xl font-bold text-[#1b0e0e]">Trading Interface</h2>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedOutcome(true)}
              className={`flex h-20 flex-col items-center justify-center rounded-xl ${
                selectedOutcome
                  ? 'bg-[#ea2a33] text-white'
                  : 'bg-[#f3e7e8] text-[#1b0e0e]'
              }`}
            >
              <span className="text-lg font-bold">YES</span>
              <span className="text-xs font-medium">(${market.yesPrice.toFixed(2)})</span>
            </button>
            <button
              onClick={() => setSelectedOutcome(false)}
              className={`flex h-20 flex-col items-center justify-center rounded-xl ${
                !selectedOutcome
                  ? 'bg-[#ea2a33] text-white'
                  : 'bg-[#f3e7e8] text-[#1b0e0e]'
              }`}
            >
              <span className="text-lg font-bold">NO</span>
              <span className="text-xs font-medium">(${market.noPrice.toFixed(2)})</span>
            </button>
          </div>
          <div className="relative">
            <input
              className="w-full rounded-full bg-[#f3e7e8] p-4 pr-24 text-[#1b0e0e] placeholder:text-[#994d51] focus:outline-none focus:ring-2 focus:ring-[#ea2a33]"
              placeholder="Enter Stake Amount"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
            />
            <button
              onClick={handleStake}
              className="absolute inset-y-0 right-0 my-2 mr-2 flex items-center justify-center rounded-full bg-[#ea2a33] px-4 text-sm font-bold text-white"
            >
              Stake
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-[#1b0e0e]">Market Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <span className="material-symbols-outlined">arrow_upward</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1b0e0e]">Trade by user123</p>
                  <p className="text-xs text-[#994d51]">100 YES shares</p>
                </div>
              </div>
              <p className="text-xs text-[#994d51]">2m ago</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <span className="material-symbols-outlined">arrow_downward</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1b0e0e]">Trade by user456</p>
                  <p className="text-xs text-[#994d51]">50 NO shares</p>
                </div>
              </div>
              <p className="text-xs text-[#994d51]">5m ago</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="sticky bottom-0 z-10 border-t border-[#f3e7e8] bg-[#fcf8f8]">
        <nav className="flex justify-around py-2">
          <button 
            onClick={() => onNavigate('markets')}
            className="flex flex-col items-center gap-1 text-[#ea2a33]"
          >
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="text-xs font-medium">Markets</span>
          </button>
          <button 
            onClick={() => onNavigate('portfolio')}
            className="flex flex-col items-center gap-1 text-[#994d51]"
          >
            <span className="material-symbols-outlined">business_center</span>
            <span className="text-xs font-medium">Portfolio</span>
          </button>
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center gap-1 text-[#994d51]"
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-xs font-medium">Account</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}