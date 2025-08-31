'use client';

import { Page } from '../DuckOracleApp';
import { WalletConnect } from '../WalletConnect';
import { useBalance } from '~/hooks/useBalance';

interface AccountProps {
  onNavigate: (page: Page) => void;
}

export function Account({ onNavigate }: AccountProps) {
  const { balance, isLoading } = useBalance();
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
          <h1 className="text-white text-lg font-bold">Account</h1>
          <div className="size-10"></div>
        </header>

        <main className="flex-1 px-4 pt-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-white text-xl font-bold">Wallet</h2>
            <WalletConnect />
          </div>
          <h2 className="text-white text-xl font-bold leading-tight tracking-tight mt-6">Funds</h2>
          <div className="mt-6 rounded-2xl bg-gray-800 p-6 text-center shadow-sm border border-gray-700">
            <p className="text-sm font-medium text-gray-400">Current Balance</p>
            <p className="text-4xl font-bold text-white mt-2">
              {isLoading ? '...' : parseFloat(balance).toFixed(2)} <span className="text-2xl font-semibold text-gray-400">$DUCK</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-14 px-6 bg-[#ea2a33] text-white text-base font-bold transition-colors hover:bg-red-700">
              <span className="material-symbols-outlined">south_west</span>
              <span className="truncate">Deposit</span>
            </button>
            <button className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-14 px-6 bg-gray-700 text-white text-base font-bold transition-colors hover:bg-gray-600">
              <span className="material-symbols-outlined">north_east</span>
              <span className="truncate">Withdraw</span>
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-white text-xl font-bold leading-tight tracking-tight">Transaction History</h3>
            <div className="mt-4 flow-root">
              <ul className="-mb-4" role="list">
                <li className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <span className="material-symbols-outlined">south_west</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-base font-semibold">Deposit</p>
                      <p className="text-gray-400 text-sm">2024-01-15 10:30 AM</p>
                    </div>
                    <p className="text-base font-semibold text-green-600">+500 $DUCK</p>
                  </div>
                </li>
                <li className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <span className="material-symbols-outlined">north_east</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-base font-semibold">Withdrawal</p>
                      <p className="text-gray-400 text-sm">2024-01-14 03:45 PM</p>
                    </div>
                    <p className="text-base font-semibold text-red-600">-200 $DUCK</p>
                  </div>
                </li>
                <li className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <span className="material-symbols-outlined">south_west</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-base font-semibold">Deposit</p>
                      <p className="text-gray-400 text-sm">2024-01-12 09:15 AM</p>
                    </div>
                    <p className="text-base font-semibold text-green-600">+1000 $DUCK</p>
                  </div>
                </li>
              </ul>
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
            className="flex flex-col items-center justify-end gap-1 text-gray-400"
          >
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            <span className="text-xs font-medium">Portfolio</span>
          </button>
          <button 
            onClick={() => onNavigate('account')}
            className="flex flex-col items-center justify-end gap-1 text-[#ea2a33]"
          >
            <span className="material-symbols-outlined text-2xl">account_circle</span>
            <span className="text-xs font-bold">Account</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}