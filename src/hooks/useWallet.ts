'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';

export function useWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const wallet = wallets[0];
  const address = wallet?.address;

  return {
    ready,
    authenticated,
    login,
    logout,
    user,
    wallet,
    address,
    isConnected: authenticated && !!address,
  };
}