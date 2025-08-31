'use client';

import dynamic from 'next/dynamic';
import { MiniAppProvider } from '@neynar/react';
import { SafeFarcasterSolanaProvider } from '~/components/providers/SafeFarcasterSolanaProvider';
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';

const PrivyProvider = dynamic(
  () => import('~/components/providers/PrivyProvider'),
  {
    ssr: false,
  }
);

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const solanaEndpoint =
    process.env.SOLANA_RPC_ENDPOINT || 'https://solana-rpc.publicnode.com';
  return (
    <PrivyProvider>
      <MiniAppProvider
        analyticsEnabled={ANALYTICS_ENABLED}
        backButtonEnabled={true}
        returnUrl={RETURN_URL}
      >
        <SafeFarcasterSolanaProvider endpoint={solanaEndpoint}>
          {children}
        </SafeFarcasterSolanaProvider>
      </MiniAppProvider>
    </PrivyProvider>
  );
}
