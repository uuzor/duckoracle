'use client';

import { useState } from 'react';
import { Page } from '../DuckOracleApp';
import { useCreateMarket } from '~/hooks/useMarkets';

interface CreateMarketProps {
  onNavigate: (page: Page) => void;
}

export function CreateMarket({ onNavigate }: CreateMarketProps) {
  const [question, setQuestion] = useState('');
  const [criteria, setCriteria] = useState('');
  const [dataSource, setDataSource] = useState<'onchain' | 'offchain'>('onchain');
  const [stake, setStake] = useState('1000');
  const [isCreating, setIsCreating] = useState(false);
  
  const { createMarket } = useCreateMarket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !criteria || !stake) return;
    
    setIsCreating(true);
    try {
      await createMarket(question, criteria, dataSource, stake);
      onNavigate('markets');
    } catch (error) {
      console.error('Failed to create market:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-900">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-900 p-4">
        <button 
          onClick={() => onNavigate('markets')}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-800"
        >
          <span className="material-symbols-outlined text-2xl text-gray-400">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold text-white">Create Market</h1>
        <div className="h-10 w-10"></div>
      </header>

      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor="event-question">
              Event Question
            </label>
            <input
              className="w-full rounded-xl bg-gray-800 p-4 text-white focus:outline-0 focus:ring-2 focus:ring-[#ea2a33] border border-gray-700 placeholder:text-gray-400"
              id="event-question"
              placeholder="e.g., Will BTC price surpass $70,000 by July 1st?"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor="resolution-criteria">
              Resolution Criteria
            </label>
            <textarea
              className="w-full min-h-[120px] resize-y rounded-xl bg-gray-800 p-4 text-white focus:outline-0 focus:ring-2 focus:ring-[#ea2a33] border border-gray-700 placeholder:text-gray-400"
              id="resolution-criteria"
              placeholder="Describe how the market will be resolved..."
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Data Sources</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDataSource('onchain')}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold ${
                  dataSource === 'onchain'
                    ? 'border-[#ea2a33] bg-[#ea2a33] bg-opacity-10 text-[#ea2a33]'
                    : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span className="material-symbols-outlined">data_object</span>
                On-Chain
              </button>
              <button
                type="button"
                onClick={() => setDataSource('offchain')}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold ${
                  dataSource === 'offchain'
                    ? 'border-[#ea2a33] bg-[#ea2a33] bg-opacity-10 text-[#ea2a33]'
                    : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span className="material-symbols-outlined">public</span>
                Off-Chain
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor="initial-stake">
              Initial Stake
            </label>
            <div className="relative">
              <input
                className="w-full rounded-xl bg-gray-800 p-4 pl-12 text-white focus:outline-0 focus:ring-2 focus:ring-[#ea2a33] border border-gray-700 placeholder:text-gray-400"
                id="initial-stake"
                placeholder="1000"
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$DUCK</span>
            </div>
          </div>
        </form>
      </main>

      <footer className="sticky bottom-0 z-10 w-full">
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleSubmit}
            disabled={isCreating || !question || !criteria || !stake}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#ea2a33] px-5 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Deploy Market'}
          </button>
        </div>
        <nav className="flex justify-around border-t border-gray-700 bg-gray-800/80 py-2 backdrop-blur-sm">
          <button 
            onClick={() => onNavigate('markets')}
            className="flex flex-col items-center gap-1 p-2 text-[#ea2a33]"
          >
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="text-xs font-medium">Markets</span>
          </button>
          <button 
            onClick={() => onNavigate('portfolio')}
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-xs font-medium">Portfolio</span>
          </button>
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-xs font-medium">Account</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}