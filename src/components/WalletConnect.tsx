'use client';

import { useWallet } from '~/hooks/useWallet';

export function WalletConnect() {
  const { ready, authenticated, login, logout, address } = useWallet();

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ea2a33]"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 bg-[#ea2a33] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#d1242b] transition-colors"
      >
        <span className="material-symbols-outlined">account_balance_wallet</span>
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-300">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </span>
      </div>
      <button
        onClick={logout}
        className="text-gray-400 hover:text-gray-200 p-1"
        title="Disconnect"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
      </button>
    </div>
  );
}