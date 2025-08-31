'use client';

import { useState } from 'react';
import { Market } from '../DuckOracleApp';
import { useBuyShares } from '~/hooks/useMarkets';

interface BetModalProps {
  market: Market;
  outcome: boolean;
  onClose: () => void;
}

export function BetModal({ market, outcome, onClose }: BetModalProps) {
  const [amount, setAmount] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  
  const { buyShares } = useBuyShares();

  const sharePrice = outcome ? market.yesPrice : market.noPrice;
  const potentialPayout = amount ? (parseFloat(amount) / sharePrice).toFixed(2) : '0';

  const handleConfirm = async () => {
    if (!amount) return;
    
    setIsPlacing(true);
    try {
      await buyShares(market.id, outcome, amount);
      onClose();
    } catch (error) {
      console.error('Failed to place bet:', error);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full bg-gray-800 rounded-t-3xl pt-2 pb-6 z-10">
        <div className="flex justify-center mb-2">
          <div className="h-1.5 w-10 rounded-full bg-gray-600"></div>
        </div>
        
        <div className="px-6 pt-4">
          <h1 className="text-white text-2xl font-bold tracking-tight">Bet on Outcome</h1>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center bg-gray-700 p-4 rounded-xl">
              <p className="text-gray-300 text-base">Outcome</p>
              <p className="text-white text-base font-semibold">{outcome ? 'YES' : 'NO'}</p>
            </div>
            
            <div className="flex justify-between items-center bg-gray-700 p-4 rounded-xl">
              <p className="text-gray-300 text-base">Current Share Price</p>
              <p className="text-white text-base font-semibold">{sharePrice.toFixed(2)} $DUCK</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="sr-only" htmlFor="duck-amount">Enter $DUCK amount</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border-gray-600 bg-gray-700 p-4 text-base text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500"
                id="duck-amount"
                placeholder="Enter $DUCK amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 bg-red-900/20 p-4 rounded-xl border border-red-800">
            <p className="text-center text-red-300 font-medium">
              Potential Payout: <span className="font-bold text-red-200">{potentialPayout} $DUCK</span>
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={handleConfirm}
              disabled={isPlacing || !amount}
              className="flex w-full items-center justify-center rounded-full h-14 px-5 bg-[#ea2a33] text-white text-lg font-bold tracking-wide shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacing ? 'Placing Bet...' : 'Confirm Bet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}