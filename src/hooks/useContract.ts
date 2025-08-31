'use client';

import { useState, useEffect } from 'react';
import { CONTRACTS, DUCK_ORACLE_ABI, DUCK_TOKEN_ABI } from '@/lib/contracts';

// Mock Web3 functionality for demo
export function useContract() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('1234.56');

  const connectWallet = async () => {
    // Mock wallet connection
    setIsConnected(true);
    setAccount('0x1234...5678');
    return true;
  };

  const createMarket = async (marketData: {
    question: string;
    criteria: string;
    dataSource: 'onchain' | 'offchain';
    stake: string;
  }) => {
    // Mock market creation
    console.log('Creating market:', marketData);
    return { success: true, marketId: Math.floor(Math.random() * 1000) };
  };

  const buyShares = async (marketId: number, outcome: boolean, amount: string) => {
    // Mock share purchase
    console.log('Buying shares:', { marketId, outcome, amount });
    return { success: true, txHash: '0xabc123...' };
  };

  const claimWinnings = async (marketId: number) => {
    // Mock claim winnings
    console.log('Claiming winnings for market:', marketId);
    return { success: true, amount: '125.50' };
  };

  const getMarketData = async (marketId: number) => {
    // Mock market data fetch
    return {
      question: "Will BTC hit $100K by end of month?",
      totalYesShares: 1000,
      totalNoShares: 800,
      totalVolume: 50000,
      status: 0, // Active
      resolutionTime: Date.now() + 15 * 24 * 60 * 60 * 1000 // 15 days
    };
  };

  return {
    isConnected,
    account,
    balance,
    connectWallet,
    createMarket,
    buyShares,
    claimWinnings,
    getMarketData
  };
}