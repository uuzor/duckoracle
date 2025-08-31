'use client';

import { useState } from 'react';
import { ConnectWallet } from './pages/ConnectWallet';
import { Markets } from './pages/Markets';
import { CreateMarket } from './pages/CreateMarket';
import { MarketDetails } from './pages/MarketDetails';
import { Account } from './pages/Account';
import { Portfolio } from './pages/Portfolio';
import { BetModal } from './modals/BetModal';
import { useMarkets, type Market } from '~/hooks/useMarkets';
import { useWallet } from '~/hooks/useWallet';

export type Page = 'connect' | 'markets' | 'create' | 'details' | 'account' | 'portfolio';
export type { Market };

export function DuckOracleApp() {
  const [currentPage, setCurrentPage] = useState<Page>('connect');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [betOutcome, setBetOutcome] = useState<boolean>(true);
  
  const { isConnected } = useWallet();
  const { markets } = useMarkets();

  const handleConnect = () => {
    setCurrentPage('markets');
  };

  const handleCreateMarket = () => {
    setCurrentPage('create');
  };

  const handleMarketClick = (market: Market) => {
    setSelectedMarket(market);
    setCurrentPage('details');
  };

  const handleBet = (outcome: boolean) => {
    setBetOutcome(outcome);
    setShowBetModal(true);
  };

  const renderPage = () => {
    if (!isConnected && currentPage !== 'connect') {
      return <ConnectWallet onConnect={handleConnect} />;
    }

    switch (currentPage) {
      case 'connect':
        return <ConnectWallet onConnect={handleConnect} />;
      case 'markets':
        return <Markets markets={markets} onMarketClick={handleMarketClick} onNavigate={setCurrentPage} onCreateMarket={handleCreateMarket} />;
      case 'create':
        return <CreateMarket onNavigate={setCurrentPage} />;
      case 'details':
        return selectedMarket ? (
          <MarketDetails 
            market={selectedMarket} 
            onBet={handleBet}
            onNavigate={setCurrentPage}
          />
        ) : null;
      case 'account':
        return <Account onNavigate={setCurrentPage} />;
      case 'portfolio':
        return <Portfolio onNavigate={setCurrentPage} />;
      default:
        return <Markets markets={markets} onMarketClick={handleMarketClick} onNavigate={setCurrentPage} onCreateMarket={handleCreateMarket} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {renderPage()}
      {showBetModal && selectedMarket && (
        <BetModal
          market={selectedMarket}
          outcome={betOutcome}
          onClose={() => setShowBetModal(false)}
        />
      )}
    </div>
  );
}