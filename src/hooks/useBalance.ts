'use client';

import { useReadContract } from 'wagmi';
import { useWallet } from './useWallet';
import { formatEther } from 'viem';

const DUCK_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_DUCK_TOKEN_ADDRESS as `0x${string}`;

const ERC20_ABI = [
  {
    "inputs": [{"type": "address", "name": "account"}],
    "name": "balanceOf",
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view",
    "type": "function"
  }
];

export function useBalance() {
  const { address, isConnected } = useWallet();

  const { data: balance, isLoading } = useReadContract({
    address: DUCK_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!DUCK_TOKEN_ADDRESS && isConnected
    }
  });

  // Mock balance if contract not available
  const mockBalance = isConnected ? "1234.56" : "0";
  const formattedBalance = balance ? formatEther(balance) : mockBalance;

  return {
    balance: formattedBalance,
    isLoading: isLoading && !!DUCK_TOKEN_ADDRESS,
    rawBalance: balance
  };
}