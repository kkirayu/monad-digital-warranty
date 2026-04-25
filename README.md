# 🛡️ Monad Digital Warranty

> A fast, secure, and scalable NFT-based digital warranty solution designed for businesses. It eliminates counterfeit receipts, prevents physical paper loss, and ensures verifiable ownership, fully powered by Monad's high throughput.

Built for the **Monad Blitz Hackathon** ⚡

---

## 🏗️ Repository Structure

This repository is uniquely structured to hold both frontend and backend code safely, optimized for seamless Vercel deployment:

- **Root Directory (`./`)**: Contains the Frontend code (React, Vite, Node modules).
- **Backend Directory (`./backend/`)**: Contains the Smart Contract code (Solidity, Hardhat, deployment scripts).

---

## ✨ Core Features

- 🔐 **Enterprise Access Control**: Role-based security for shop admins.
- 📋 **Product Registry**: On-chain cataloging for data consistency.
- 🔢 **Auto-Generated Serial Numbers**: Cryptographic (`keccak256`) unique SNs.
- 📦 **High-Volume Batch Minting**: Gas-efficient bulk warranty issuance.

---

## 🛠️ Tech Stack

**Frontend:**
- React
- Vite
- Ethers.js

**Backend:**
- Solidity ^0.8.24
- Hardhat
- OpenZeppelin v5

**Network:**
- Monad Testnet

---

## 🚀 Local Setup Instructions

### Frontend Setup

1. Install dependencies in the root directory:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup (Smart Contracts)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Compile the smart contracts:
   ```bash
   npx hardhat compile
   ```

*(Note: Sensitive information such as specific Contract Addresses, Admin Wallet Addresses, or Private Keys should **never** be committed to this repository. Please configure your `.env` appropriately during deployments.)*

---

<p align="center">
  <i>Empowering consumer rights through high-performance blockchain tech on Monad.</i>
</p>
