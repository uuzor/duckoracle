'use client';

import { useWallet } from '~/hooks/useWallet';

interface ConnectWalletProps {
  onConnect: () => void;
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const { login, isConnected } = useWallet();

  const handleConnect = async () => {
    if (!isConnected) {
      await login();
    }
    onConnect();
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-gray-900">
      <header className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <svg className="h-8 w-8 text-[#ea2a33]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.03 2.03c.53 0 .96.43.96.96v.04c-.45 2.11-1.63 4-3.19 5.37-1.74 1.5-3.96 2.37-6.28 2.4-1.63.02-3.23-.33-4.66-1.02-.3-.14-.42-.51-.28-.82l.01-.02c.14-.3.5-.42.82-.28.1.04.2.1.3.15 2.56 1.2 5.59.78 7.76-1.03 1.77-1.48 2.74-3.58 3.12-5.78v.03c0-.53.43-.96.96-.96z"/>
          </svg>
          <h2 className="text-2xl font-bold tracking-tight text-white">DuckOracle</h2>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Connect Your Wallet</h1>
          <p className="mt-4 text-lg text-gray-400">To participate in prediction markets, connect your DuckChain-compatible wallet.</p>
        </div>
        
        <div className="w-full max-w-sm">
          <button 
            onClick={handleConnect}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#ea2a33] px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="truncate">Connect Wallet</span>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">New to DuckChain?</p>
          <a className="mt-2 inline-block font-semibold text-[#ea2a33] underline-offset-4 hover:underline" href="#">
            Learn how to get $DUCK tokens
          </a>
        </div>
      </main>

      <footer className="sticky bottom-0 w-full bg-gray-800/80 backdrop-blur-sm">
        <div className="flex justify-around border-t border-gray-700 p-2">
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-[#ea2a33]">
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400">
            <span className="material-symbols-outlined">search</span>
            <span className="text-xs font-medium">Explore</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="text-xs font-medium">Create</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400">
            <span className="material-symbols-outlined">person</span>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </footer>
    </div>
  );
}