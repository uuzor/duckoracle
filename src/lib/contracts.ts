// Contract addresses and ABIs for DuckOracle
export const CONTRACTS = {
  DUCK_TOKEN: '0x...', // Will be deployed
  DUCK_ORACLE: '0x...', // Will be deployed
  CHAINGPT_ORACLE: '0x...', // Will be deployed
};

// Simplified ABI for frontend integration
export const DUCK_ORACLE_ABI = [
  {
    "inputs": [
      {"name": "question", "type": "string"},
      {"name": "resolutionCriteria", "type": "string"},
      {"name": "dataSource", "type": "uint8"},
      {"name": "resolutionTime", "type": "uint256"},
      {"name": "initialLiquidity", "type": "uint256"}
    ],
    "name": "createMarket",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "marketId", "type": "uint256"},
      {"name": "outcome", "type": "bool"},
      {"name": "maxCost", "type": "uint256"}
    ],
    "name": "buyShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "marketId", "type": "uint256"}],
    "name": "claimWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "marketId", "type": "uint256"}],
    "name": "getMarket",
    "outputs": [
      {"name": "question", "type": "string"},
      {"name": "creator", "type": "address"},
      {"name": "totalYesShares", "type": "uint256"},
      {"name": "totalNoShares", "type": "uint256"},
      {"name": "totalVolume", "type": "uint256"},
      {"name": "status", "type": "uint8"},
      {"name": "outcome", "type": "bool"},
      {"name": "resolutionTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const DUCK_TOKEN_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];