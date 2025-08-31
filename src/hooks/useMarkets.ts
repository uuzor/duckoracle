'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

const DUCK_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_DUCK_ORACLE_ADDRESS as `0x${string}`;
const DUCK_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_DUCK_TOKEN_ADDRESS as `0x${string}`;

const DUCK_ORACLE_ABI = [
  {
    "inputs": [{"type": "uint256", "name": "marketId"}],
    "name": "markets",
    "outputs": [
      {"type": "uint256", "name": "id"},
      {"type": "string", "name": "question"},
      {"type": "string", "name": "resolutionCriteria"},
      {"type": "address", "name": "creator"},
      {"type": "uint8", "name": "dataSource"},
      {"type": "uint256", "name": "creationTime"},
      {"type": "uint256", "name": "resolutionTime"},
      {"type": "uint256", "name": "totalYesShares"},
      {"type": "uint256", "name": "totalNoShares"},
      {"type": "uint256", "name": "totalVolume"},
      {"type": "uint8", "name": "status"},
      {"type": "bool", "name": "outcome"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "string", "name": "question"},
      {"type": "string", "name": "resolutionCriteria"},
      {"type": "uint8", "name": "dataSource"},
      {"type": "uint256", "name": "resolutionTime"},
      {"type": "uint256", "name": "initialLiquidity"}
    ],
    "name": "createMarket",
    "outputs": [{"type": "uint256", "name": "marketId"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "uint256", "name": "marketId"},
      {"type": "bool", "name": "outcome"},
      {"type": "uint256", "name": "amount"}
    ],
    "name": "buyShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export interface Market {
  id: number;
  question: string;
  yesPrice: number;
  noPrice: number;
  timeLeft: string;
  totalVolume: number;
  status: 'active' | 'resolving' | 'resolved';
  outcome?: boolean;
  resolutionTime: number;
  totalYesShares: number;
  totalNoShares: number;
}

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback to mock data if contracts not deployed
  const mockMarkets: Market[] = [
    {
      id: 1,
      question: "Will BTC hit $100K by end of month?",
      yesPrice: 0.55,
      noPrice: 0.45,
      timeLeft: "15d 8h",
      totalVolume: 50000,
      status: 'active',
      resolutionTime: Date.now() + 15 * 24 * 60 * 60 * 1000,
      totalYesShares: 27500,
      totalNoShares: 22500
    },
    {
      id: 2,
      question: "Will ETH reach $5,000 by year-end?",
      yesPrice: 0.83,
      noPrice: 0.17,
      timeLeft: "2d 12h",
      totalVolume: 25000,
      status: 'active',
      resolutionTime: Date.now() + 2.5 * 24 * 60 * 60 * 1000,
      totalYesShares: 20750,
      totalNoShares: 4250
    },
    {
      id: 3,
      question: "Will DUCK token reach $10 by Q1 2025?",
      yesPrice: 0.72,
      noPrice: 0.28,
      timeLeft: "45d 6h",
      totalVolume: 15000,
      status: 'active',
      resolutionTime: Date.now() + 45 * 24 * 60 * 60 * 1000,
      totalYesShares: 10800,
      totalNoShares: 4200
    }
  ];

  const calculateTimeLeft = (resolutionTime: number): string => {
    const now = Date.now();
    const diff = resolutionTime - now;
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  };

  useEffect(() => {
    // Update time left for all markets
    const updateTimeLeft = () => {
      setMarkets(prevMarkets => 
        prevMarkets.map(market => ({
          ...market,
          timeLeft: calculateTimeLeft(market.resolutionTime)
        }))
      );
    };

    // Use mock data initially
    setMarkets(mockMarkets.map(market => ({
      ...market,
      timeLeft: calculateTimeLeft(market.resolutionTime)
    })));
    setLoading(false);

    // Update time left every minute
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  return { markets, loading };
}

export function useCreateMarket() {
  const { writeContract } = useWriteContract();

  const createMarket = async (
    question: string,
    criteria: string,
    dataSource: 'onchain' | 'offchain',
    stake: string
  ) => {
    if (!DUCK_ORACLE_ADDRESS) {
      console.log('Mock create market:', { question, criteria, dataSource, stake });
      return;
    }

    const resolutionTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    const initialLiquidity = parseEther(stake);

    writeContract({
      address: DUCK_ORACLE_ADDRESS,
      abi: DUCK_ORACLE_ABI,
      functionName: 'createMarket',
      args: [
        question,
        criteria,
        dataSource === 'onchain' ? 0 : 1,
        BigInt(resolutionTime),
        initialLiquidity
      ]
    });
  };

  return { createMarket };
}

export function useBuyShares() {
  const { writeContract } = useWriteContract();

  const buyShares = async (marketId: number, outcome: boolean, amount: string) => {
    if (!DUCK_ORACLE_ADDRESS) {
      console.log('Mock buy shares:', { marketId, outcome, amount });
      return;
    }

    const amountWei = parseEther(amount);

    writeContract({
      address: DUCK_ORACLE_ADDRESS,
      abi: DUCK_ORACLE_ABI,
      functionName: 'buyShares',
      args: [BigInt(marketId), outcome, amountWei]
    });
  };

  return { buyShares };
}