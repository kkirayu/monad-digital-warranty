# Decentralized Digital Warranty System

## Abstract

The **Decentralized Digital Warranty System** replaces traditional, easily lost, and counterfeit-prone paper warranties with secure, non-fungible tokens (NFTs). Deployed on the highly scalable and blazing-fast Monad blockchain, this platform enables retailers and enterprises to seamlessly issue, track, and verify product warranties. By bringing verifiable ownership on-chain, businesses can provide their customers with peace of mind through a transparent, immutable digital guarantee.

---

## ✨ Key Features

- 🔐 **Transparent Ownership:** Warranty NFTs reside in the purchaser's wallet, ensuring clear, indisputable ownership that cannot be lost like paper receipts.
- 🛡️ **Anti-Counterfeit Logic:** Warranties generate unique, human-readable Serial Numbers via on-chain `keccak256` hashing routines. A product whitelist system ensures that warranties can only be issued for authorized items.
- ⚡ **Batch Processing for Enterprises:** Engineered to accommodate large-scale retail operations, our contracts leverage gas-optimized indexed loops for CSV-based batch minting, perfectly complementing Monad's parallel execution layer.
- 🏢 **Enterprise-Grade Access Control:** Strictly enforced roles (`ADMIN_ROLE`, `MINTER_ROLE`) allow businesses to delegate operational functions to retail staff or automated systems securely.

---

## 🏗 Architecture Overview

Our system relies on a seamless interaction between three core layers:

1. **Smart Contract (Solidity):** The backbone of our warranty logic. Handles the ERC721-based warranty minting, role-based access, serial number generation, and product registries.
2. **Monad Network:** Serving as the execution layer, Monad provides extreme throughput and sub-second finality. It naturally accommodates high-volume transactional flows, such as point-of-sale systems batching hundreds of warranties.
3. **User Interface (Frontend):** Facilitates user interactions—whether it's an administrator registering a new product line or a user checking their warranty expiration date—connected to the blockchain via asynchronous RPC calls.

---

## 🛠 Tech Stack

- **Blockchain Engine:** Solidity (`^0.8.24`)
- **Development Environment:** Hardhat (with TypeScript)
- **Smart Contract Libraries:** OpenZeppelin v5 (AccessControl, ERC721)
- **Web3 Interaction:** Ethers.js
- **Execution Network Target:** Monad

---

## 🚀 Installation & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Prasetyant0/monad-digital-warranty-backend.git
cd decentralized-warranty
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory to store your deployment credentials.
*(Note: Never commit your `.env` file to a public repository!)*

```env
PRIVATE_KEY="<YOUR_DEPLOYER_WALLET_PRIVATE_KEY>"
RPC_URL="<MONAD_RPC_URL>"
```

### 4. Compile the Smart Contracts
```bash
npx hardhat compile
```

### 5. Deploy Locally or to Testnet
```bash
# To run on a specified network
npx hardhat run scripts/deploy.ts --network <network-name>
```

---

## 📜 License

This project is licensed under the MIT License - see the `LICENSE` file for details.
