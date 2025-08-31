'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig } from 'wagmi';
import { mainnet, base, arbitrum } from 'wagmi/chains';
import { http } from 'viem';

// DuckChain configuration
const duckchain = {
  id: 20241130,
  name: 'DuckChain',
  network: 'duckchain',
  nativeCurrency: {
    decimals: 18,
    name: 'DUCK',
    symbol: 'DUCK',
  },
  rpcUrls: {
    public: { http: ['https://rpc.duckchain.io'] },
    default: { http: ['https://rpc.duckchain.io'] },
  },
  blockExplorers: {
    default: { name: 'DuckScan', url: 'https://scan.duckchain.io' },
  },
} as const;

const config = createConfig({
  chains: [duckchain, mainnet, base, arbitrum],
  transports: {
    [duckchain.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function PrivyWagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['wallet', 'email', 'sms'],
        appearance: {
          theme: 'light',
          accentColor: '#ea2a33',
        },
        defaultChain: duckchain,
        supportedChains: [duckchain, mainnet, base, arbitrum],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}