# Privy Wallet Integration Setup

## Overview
DuckOracle now uses Privy for wallet connections, providing a seamless authentication experience with support for multiple wallet types and embedded wallets.

## Setup Instructions

1. **Get Privy App ID**
   - Visit [Privy Dashboard](https://dashboard.privy.io)
   - Create a new app or use existing one
   - Copy your App ID

2. **Environment Configuration**
   Add to your `.env.local` file:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
   ```

3. **Supported Features**
   - Email/SMS authentication
   - External wallet connections (MetaMask, Coinbase, etc.)
   - Embedded wallets for users without existing wallets
   - DuckChain network support
   - Multi-chain support (Mainnet, Base, Arbitrum)

## Usage

### Connect Wallet
```tsx
import { useWallet } from '~/hooks/useWallet';

function MyComponent() {
  const { isConnected, address, login } = useWallet();
  
  if (!isConnected) {
    return <button onClick={login}>Connect Wallet</button>;
  }
  
  return <div>Connected: {address}</div>;
}
```

### Access Wallet Info
```tsx
import { useWallet } from '~/hooks/useWallet';

function WalletInfo() {
  const { wallet, address, authenticated } = useWallet();
  
  return (
    <div>
      {authenticated && (
        <p>Wallet Address: {address}</p>
      )}
    </div>
  );
}
```

## Configuration

The Privy provider is configured with:
- **Login Methods**: Wallet, Email, SMS
- **Theme**: Light mode with DuckOracle branding
- **Default Chain**: DuckChain
- **Embedded Wallets**: Auto-created for users without wallets
- **Supported Chains**: DuckChain, Mainnet, Base, Arbitrum

## Components

- `PrivyProvider`: Main provider wrapper
- `WalletConnect`: Connection button component
- `useWallet`: Custom hook for wallet access