<!-- @format -->

# CertChain - Blockchain Academic Credentials

A decentralized platform for issuing and verifying academic certificates as Soulbound NFTs on the Polygon blockchain. Built with React, TypeScript, and Solidity.

![CertChain](https://img.shields.io/badge/Blockchain-Polygon-8247E5?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)

## ✨ Features

- **Soulbound Certificates** - Non-transferable NFTs permanently bound to student wallets
- **Institution Authorization** - Multi-tier access control for approved institutions
- **IPFS Storage** - Decentralized certificate file storage via Pinata
- **Instant Verification** - Verify certificates by Token ID, file hash, or QR code
- **Mobile Responsive** - Full mobile support with QR code scanning
- **Transparency Dashboard** - Public audit trail of all certificate activities
- **Revocation Support** - Institutions can revoke certificates with reason tracking
- **Admin Panel** - Comprehensive dashboard for managing institutions and certificates

## Tech Stack

| Layer               | Technology                                          |
| ------------------- | --------------------------------------------------- |
| **Frontend**        | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Blockchain**      | Polygon (Amoy Testnet / Mainnet), Solidity 0.8.21   |
| **Smart Contracts** | Hardhat, OpenZeppelin, ERC-721                      |
| **Storage**         | IPFS via Pinata                                     |
| **Backend**         | Lovable Cloud (Edge Functions)                      |
| **Web3**            | ethers.js v6                                        |

##Pages & Functionality

| Page                               | Description                                            |
| ---------------------------------- | ------------------------------------------------------ |
| **Home** (`/`)                     | Landing page with features overview and how it works   |
| **Verify** (`/verify`)             | Public certificate verification by Token ID or QR scan |
| **Student** (`/student`)           | Students view their certificates and generate QR codes |
| **Institution** (`/institution`)   | Authorized institutions issue new certificates         |
| **Admin** (`/admin`)               | Contract owner manages institutions and admins         |
| **Transparency** (`/transparency`) | Public audit log of all certificate activities         |

---

## 🔄 How It Works

CertChain creates a tamper-proof link between physical/digital certificates and blockchain records. Here's the complete workflow:

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CERTCHAIN ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐│
│  │   FRONTEND   │     │   BACKEND    │     │         BLOCKCHAIN           ││
│  │   (React)    │────▶│ (Edge Func)  │────▶│     (Polygon Network)        ││
│  └──────────────┘     └──────────────┘     └──────────────────────────────┘│
│         │                    │                          │                   │
│         │                    ▼                          ▼                   │
│         │             ┌──────────────┐          ┌──────────────┐           │
│         │             │    IPFS      │          │ Smart Contract│           │
│         │             │  (Pinata)    │          │ (CertChainSBT)│           │
│         │             └──────────────┘          └──────────────┘           │
│         │                    │                          │                   │
│         ▼                    ▼                          ▼                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA FLOW                                     │  │
│  │  Certificate PDF → SHA-256 Hash → IPFS Upload → NFT Mint → Verify   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Certificate Issuance Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CERTIFICATE ISSUANCE PROCESS                         │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: UPLOAD                    Step 2: HASH                    Step 3: STORE
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│  Certificate    │              │     SHA-256     │              │   IPFS           │
│     PDF/Image   │─────────────▶│     Hash        │─────────────▶│     Storage     │
│                 │              │  Generation     │              │  (Pinata)       │
└─────────────────┘              └─────────────────┘              └─────────────────┘
                                                                          │
                                                                          ▼
Step 6: COMPLETE                  Step 5: RECORD                  Step 4: MINT
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│  Certificate │              │  Blockchain  │              │  Soulbound   │
│     Issued!     │◀─────────────│     Record      │◀─────────────│     NFT Token   │
│                 │              │  (Immutable)    │              │                 │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

### Detailed Step-by-Step Process

#### 1️⃣ Institution Uploads Certificate

```
Institution Portal (/institution)
         │
         ▼
┌────────────────────────────────────┐
│  Institution uploads:              │
│  • Certificate PDF/image           │
│  • Student wallet address          │
│  • Student name                    │
│  • Degree/certificate name         │
└────────────────────────────────────┘
```

The authorized institution uploads the physical certificate scan or digital certificate file along with student details.

#### 2️⃣ File Hashing (SHA-256)

```javascript
// Frontend generates cryptographic hash
const fileBuffer = await file.arrayBuffer();
const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
const fileHash = Array.from(new Uint8Array(hashBuffer))
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("");

// Result: "a7f5c3d2e1b4..."  (64-character hex string)
```

This hash acts as a **digital fingerprint**:

- Any modification to the file produces a completely different hash
- Same file always produces the same hash
- Impossible to reverse-engineer the file from the hash

#### 3️⃣ IPFS Upload (Decentralized Storage)

```
┌─────────────────────────────────────────────────────────┐
│                    IPFS STORAGE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Certificate File ──────▶ Edge Function ──────▶ Pinata │
│                                │                        │
│                                ▼                        │
│                    ┌───────────────────────┐           │
│                    │  CID (Content ID):    │           │
│                    │  QmXoypizjW3WknFi... │           │
│                    └───────────────────────┘           │
│                                                         │
│  • Decentralized storage across multiple nodes         │
│  • Content-addressable (CID = hash of content)         │
│  • Immutable - content cannot be changed               │
│  • Permanent - no single point of failure              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

The file is uploaded to IPFS via Pinata, returning a unique Content Identifier (CID).

#### 4️⃣ Smart Contract Minting

```solidity
// CertChainSBT.sol - Simplified
function mintCertificate(
    address student,           // Student's wallet address
    string memory studentName, // "John Doe"
    string memory degreeName,  // "Bachelor of Science"
    string memory ipfsCID,     // "QmXoypizjW3WknFi..."
    string memory fileHash,    // "a7f5c3d2e1b4..."
    string memory tokenURI     // Metadata URI
) external onlyAuthorizedInstitution returns (uint256) {

    // Ensure hash is unique (no duplicates)
    require(!hashExists[fileHash], "Certificate already exists");

    // Mint soulbound NFT to student
    uint256 tokenId = _mint(student);

    // Store certificate data on-chain
    certificates[tokenId] = Certificate({
        ipfsCID: ipfsCID,
        fileHash: fileHash,
        institution: msg.sender,
        studentName: studentName,
        degreeName: degreeName,
        issuedAt: block.timestamp,
        revoked: false
    });

    return tokenId;
}
```

The smart contract:

- Verifies the institution is authorized
- Checks no duplicate certificate exists (via hash)
- Mints a non-transferable (soulbound) NFT
- Records all metadata immutably on-chain

#### 5️⃣ Blockchain Record Created

```
┌─────────────────────────────────────────────────────────┐
│              ON-CHAIN CERTIFICATE RECORD                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Token ID:        #42                                   │
│  Owner:           0x1234...5678 (Student wallet)        │
│  ─────────────────────────────────────────────────────  │
│  IPFS CID:        QmXoypizjW3WknFiJNRmS2G...           │
│  File Hash:       a7f5c3d2e1b4f8a9c0d3e2f1...         │
│  Institution:     0xABCD...EF01                         │
│  Student Name:    John Doe                              │
│  Degree:          Bachelor of Computer Science          │
│  Issued:          Jan 19, 2026 14:32:01 UTC             │
│  Revoked:         false                                 │
│  ─────────────────────────────────────────────────────  │
│  Transaction:     0x9f8e7d6c5b4a...                    │
│  Block:           #12345678                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CERTIFICATE VERIFICATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

                     OPTION A                           OPTION B
              ┌─────────────────┐                ┌─────────────────┐
              │  📱 Scan QR     │                │  🔢 Enter Token │
              │     Code        │                │     ID          │
              └────────┬────────┘                └────────┬────────┘
                       │                                  │
                       └──────────────┬───────────────────┘
                                      ▼
                       ┌─────────────────────────┐
                       │  Query Smart Contract   │
                       │  verifyCertificate()    │
                       └────────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌─────────────────┐             ┌─────────────────┐
          │  ✅ VALID       │             │  ❌ INVALID     │
          │  Certificate    │             │  Not found /    │
          │  exists & not   │             │  Revoked        │
          │  revoked        │             │                 │
          └─────────────────┘             └─────────────────┘
                    │
                    ▼
          ┌─────────────────────────────────────┐
          │  OPTIONAL: File Hash Verification   │
          │  Upload original file → Compare     │
          │  computed hash with stored hash     │
          └─────────────────────────────────────┘
```

### Why Soulbound Tokens?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOULBOUND TOKEN (SBT)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Regular NFT                          Soulbound NFT (CertChain)            │
│   ───────────                          ─────────────────────────            │
│                                                                             │
│   ┌─────┐  transfer  ┌─────┐           ┌─────┐  ❌ BLOCKED  ┌─────┐        │
│   │ 👤A │ ─────────▶ │ 👤B │           │ 👤A │ ───────────▶ │ 👤B │        │
│   └─────┘            └─────┘           └─────┘              └─────┘        │
│                                                                             │
│   • Can be sold/traded                 • Permanently bound to owner         │
│   • Ownership can change               • Cannot be sold or transferred      │
│   • Value can fluctuate                • Represents identity/achievement    │
│                                                                             │
│   Use case: Art, collectibles          Use case: Credentials, certificates  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Why this matters for certificates:
├── 🎓 Degree belongs to YOU forever
├── 🚫 Cannot be sold to someone else
├── 🔒 Proves authentic ownership
└── ✅ Employer can verify you earned it
```

### Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ACCESS CONTROL SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌───────────────────┐                                │
│                        │   CONTRACT OWNER  │                                │
│                        │   (Deployer)      │                                │
│                        └─────────┬─────────┘                                │
│                                  │                                          │
│                    ┌─────────────┴─────────────┐                            │
│                    ▼                           ▼                            │
│           ┌───────────────┐           ┌───────────────┐                     │
│           │    ADMINS     │           │  INSTITUTIONS │                     │
│           │               │           │               │                     │
│           └───────┬───────┘           └───────┬───────┘                     │
│                   │                           │                             │
│                   ▼                           ▼                             │
│    ┌──────────────────────────┐  ┌──────────────────────────┐              │
│    │ • Grant/revoke admins    │  │ • Issue certificates     │              │
│    │ • Authorize institutions │  │ • Revoke own certs       │              │
│    │ • Revoke institutions    │  │ • View issued certs      │              │
│    │ • Revoke any certificate │  │                          │              │
│    └──────────────────────────┘  └──────────────────────────┘              │
│                                                                             │
│                              PUBLIC ACCESS                                  │
│                    ┌──────────────────────────────┐                         │
│                    │ • Verify any certificate     │                         │
│                    │ • View transparency logs     │                         │
│                    │ • Check institution status   │                         │
│                    └──────────────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Integrity Guarantee

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOW DATA INTEGRITY IS GUARANTEED                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ORIGINAL FILE                    TAMPERED FILE                             │
│  ─────────────                    ─────────────                             │
│                                                                             │
│  ┌──────────────┐                ┌──────────────┐                          │
│  │ Certificate  │                │ Certificate  │                          │
│  │ John Doe     │                │ Jane Doe     │  ← Changed name          │
│  │ BSc CompSci  │                │ BSc CompSci  │                          │
│  └──────────────┘                └──────────────┘                          │
│         │                               │                                   │
│         ▼                               ▼                                   │
│  SHA-256 Hash:                   SHA-256 Hash:                             │
│  a7f5c3d2e1b4...                 9x2y1z8w7v6...  ← Completely different!  │
│         │                               │                                   │
│         ▼                               ▼                                   │
│  ┌──────────────┐                ┌──────────────┐                          │
│  │ Matches      │                │ Does NOT     │                          │
│  │ blockchain   │                │ match chain  │                          │
│  │ ✅ VALID     │                │ ❌ FORGERY   │                          │
│  └──────────────┘                └──────────────┘                          │
│                                                                             │
│  Even a single pixel or character change = completely different hash       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CERTCHAIN COMPLETE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INSTITUTIONS                STUDENTS                 VERIFIERS             │
│  ────────────                ────────                 ─────────             │
│       │                          │                        │                 │
│       │ 1. Upload cert           │                        │                 │
│       │ 2. Enter details         │                        │                 │
│       ▼                          │                        │                 │
│  ┌─────────┐                     │                        │                 │
│  │ FRONTEND│                     │                        │                 │
│  │ React   │                     │                        │                 │
│  └────┬────┘                     │                        │                 │
│       │ 3. Hash file             │                        │                 │
│       │ 4. Call edge function    │                        │                 │
│       ▼                          │                        │                 │
│  ┌─────────┐                     │                        │                 │
│  │ EDGE    │                     │                        │                 │
│  │ FUNCTION│ 5. Upload to IPFS   │                        │                 │
│  └────┬────┘                     │                        │                 │
│       │                          │                        │                 │
│       ▼                          │                        │                 │
│  ┌─────────┐                     │                        │                 │
│  │ PINATA  │ 6. Return CID       │                        │                 │
│  │ (IPFS)  │                     │                        │                 │
│  └────┬────┘                     │                        │                 │
│       │                          │                        │                 │
│       ▼                          │                        │                 │
│  ┌─────────┐                     │                        │                 │
│  │ SMART   │ 7. Mint SBT         │                        │                 │
│  │CONTRACT │ 8. Store on-chain   │                        │                 │
│  └────┬────┘                     │                        │                 │
│       │                          │                        │                 │
│       │ 9. NFT transferred       │                        │                 │
│       └─────────────────────────▶│                        │                 │
│                                  │                        │                 │
│                   10. View certs │                        │                 │
│                   11. Generate QR│                        │                 │
│                                  │                        │                 │
│                                  │ 12. Share QR/Token ID  │                 │
│                                  └───────────────────────▶│                 │
│                                                           │                 │
│                                            13. Scan/Enter │                 │
│                                            14. Query chain│                 │
│                                            15. ✅ Verified│                 │
│                                                           │                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

> **Complete setup in ~15 minutes** - Follow these steps to get CertChain running locally with your own smart contract.

### 📋 Prerequisites

Before you begin, ensure you have:

| Requirement               | How to Check      | Download                                                |
| ------------------------- | ----------------- | ------------------------------------------------------- |
| **Node.js v18+**          | `node --version`  | [nodejs.org](https://nodejs.org/)                       |
| **npm or Bun**            | `npm --version`   | Comes with Node.js                                      |
| **Git**                   | `git --version`   | [git-scm.com](https://git-scm.com/)                     |
| **MetaMask**              | Browser extension | [metamask.io](https://metamask.io/)                     |
| **VS Code** (recommended) | -                 | [code.visualstudio.com](https://code.visualstudio.com/) |

---

### Step 1️⃣: Clone & Install Dependencies

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install frontend dependencies
npm install
```

Now install smart contract dependencies:

```bash
# Navigate to contracts folder
cd contracts

# Install Hardhat and dependencies
npm install

# Go back to root
cd ..
```

**Expected result:** No errors, `node_modules` folder created in both root and `contracts/`.

---

### Step 2️⃣: Set Up MetaMask for Polygon Amoy Testnet

1. **Open MetaMask** → Click network dropdown → **Add Network**

2. **Add Polygon Amoy Testnet manually:**

   | Field           | Value                                 |
   | --------------- | ------------------------------------- |
   | Network Name    | `Polygon Amoy Testnet`                |
   | RPC URL         | `https://rpc-amoy.polygon.technology` |
   | Chain ID        | `80002`                               |
   | Currency Symbol | `MATIC`                               |
   | Block Explorer  | `https://amoy.polygonscan.com`        |

3. **Get free test MATIC:**
   - Go to [Polygon Faucet](https://faucet.polygon.technology/)
   - Select **Amoy** network
   - Enter your wallet address
   - Request 0.2 MATIC (enough for many transactions)

---

### Step 3️⃣: Configure Contract Environment

```bash
# Navigate to contracts folder
cd contracts

# Create your environment file
cp .env.example .env
```

**Edit `contracts/.env`** in VS Code:

```env
# Your MetaMask private key (WITHOUT the 0x prefix!)
# ⚠️ NEVER share or commit this file!
PRIVATE_KEY=abc123def456...your64characterprivatekey

# RPC URLs (defaults work fine)
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com

# Optional: For contract verification on PolygonScan
POLYGONSCAN_API_KEY=your_api_key_here
```

**🔐 How to get your private key from MetaMask:**

1. Open MetaMask → Click the 3 dots → **Account Details**
2. Click **Show Private Key**
3. Enter your password
4. Copy the key (without `0x` prefix)

⚠️ **SECURITY WARNING:**

- Never share your private key
- Never commit `.env` to Git (it's already in `.gitignore`)
- Use a dedicated development wallet with only testnet funds

---

### Step 4️⃣: Deploy the Smart Contract

```bash
# Make sure you're in the contracts folder
cd contracts

# Compile the contract
npx hardhat compile
```

**Expected output:**

```
Compiled 1 Solidity file successfully
```

Now deploy to Polygon Amoy:

```bash
npx hardhat run scripts/deploy.cjs --network polygonAmoy
```

**✅ Expected output:**

```
Deploying CertChainSBT...
CertChainSBT deployed to: 0x1234567890abcdef1234567890abcdef12345678
Contract owner: 0xYourWalletAddress
Deployment complete!
```

📝 **COPY the deployed contract address!** You'll need it in the next step.

---

### Step 5️⃣: Configure the Frontend

Navigate back to root and edit `src/lib/constants.ts`:

```bash
cd ..
```

Open `src/lib/constants.ts` and update these values:

```typescript
// ⬇️ Change this from true to false
export const DEMO_MODE = false;

// ⬇️ Paste your deployed contract address here
export const CONTRACT_ADDRESSES = {
	amoy: "0x1234567890abcdef1234567890abcdef12345678", // Your address!
	mainnet: "0x0000000000000000000000000000000000000000",
};
```

---

### Step 6️⃣: Run the Application

```bash
# From the project root folder
npm run dev
```

**✅ Expected output:**

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

🎉 **Open [http://localhost:5173](http://localhost:5173)** in your browser!

---

### Step 7️⃣: Verify Everything Works

1. **Connect Wallet:** Click "Connect Wallet" in the header and connect MetaMask
2. **Check Network:** Ensure you're on Polygon Amoy Testnet
3. **Admin Access:** Navigate to `/admin` - you should see the admin panel (you're the contract owner!)
4. **Approve an Institution:** Add your own wallet as an approved institution for testing

---

### 🎯 Quick Start Checklist

- [ ] Node.js v18+ installed
- [ ] MetaMask installed with Polygon Amoy network added
- [ ] Test MATIC received from faucet
- [ ] `npm install` completed in root folder
- [ ] `npm install` completed in `contracts/` folder
- [ ] `contracts/.env` created with your private key
- [ ] Contract compiled with `npx hardhat compile`
- [ ] Contract deployed with `npx hardhat run scripts/deploy.js --network polygonAmoy`
- [ ] Contract address updated in `src/lib/constants.ts`
- [ ] `DEMO_MODE` set to `false`
- [ ] App running with `npm run dev`
- [ ] Wallet connected and working

---

### 🆘 Quick Start Troubleshooting

| Problem                        | Solution                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `npm install` fails            | Delete `node_modules` and `package-lock.json`, run `npm install` again                   |
| "Cannot find module 'hardhat'" | Run `npm install` inside the `contracts/` folder                                         |
| "Invalid private key"          | Remove `0x` prefix from your key, check for extra spaces                                 |
| "Insufficient funds"           | Get more test MATIC from [faucet.polygon.technology](https://faucet.polygon.technology/) |
| "Network not found"            | Use `polygonAmoy` (not `amoy`) in the deploy command                                     |
| Contract functions fail        | Verify `DEMO_MODE = false` and contract address is correct                               |
| MetaMask not connecting        | Refresh page, check you're on Polygon Amoy network                                       |

---

## 🔧 Configuration

### Pinata API Keys (IPFS)

The app uses Pinata for IPFS storage. Configure in Lovable Cloud secrets:

1. Create account at [pinata.cloud](https://pinata.cloud)
2. Go to **API Keys** → **New Key**
3. Enable `pinFileToIPFS` and `pinJSONToIPFS` permissions
4. Add to Lovable Cloud secrets:
   - `PINATA_API_KEY`
   - `PINATA_SECRET_KEY`

### Network Configuration

Supported networks in `src/lib/constants.ts`:

| Network                | Chain ID | Explorer                                             |
| ---------------------- | -------- | ---------------------------------------------------- |
| Polygon Amoy (Testnet) | 80002    | [amoy.polygonscan.com](https://amoy.polygonscan.com) |
| Polygon Mainnet        | 137      | [polygonscan.com](https://polygonscan.com)           |

---

## 📁 Project Structure

```
certchain/
├── contracts/                    # Smart contracts
│   ├── CertChainSBT.sol          # Main soulbound certificate contract
│   ├── hardhat.config.js         # Hardhat configuration
│   ├── scripts/deploy.js         # Deployment script
│   ├── test/                     # Contract tests
│   └── .env.example              # Environment template
│
├── src/
│   ├── components/
│   │   ├── layout/               # Header, Footer, Layout components
│   │   ├── home/                 # Landing page sections
│   │   ├── admin/                # Admin dashboard components
│   │   ├── ui/                   # shadcn/ui components
│   │   └── CertificateQRModal.tsx
│   │
│   ├── contexts/
│   │   └── WalletContext.tsx     # MetaMask wallet state
│   │
│   ├── hooks/
│   │   ├── useWallet.ts          # Wallet connection hook
│   │   └── useActivityLog.ts     # Activity logging hook
│   │
│   ├── lib/
│   │   ├── constants.ts          # ⭐ Contract address & config
│   │   ├── contract.ts           # Contract interaction functions
│   │   ├── contractABI.ts        # Contract ABI
│   │   ├── demoData.ts           # Demo mode mock data
│   │   └── ipfs.ts               # IPFS upload helpers
│   │
│   └── pages/
│       ├── Index.tsx             # Home page
│       ├── Verify.tsx            # Certificate verification
│       ├── Student.tsx           # Student dashboard
│       ├── Institution.tsx       # Institution portal
│       ├── Admin.tsx             # Admin panel
│       └── Transparency.tsx      # Public audit log
│
└── supabase/
    └── functions/
        └── ipfs-upload/          # IPFS upload edge function
```

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

### Contract Coverage

```bash
npx hardhat coverage
```

---

## 🔒 Security Features

| Feature                  | Implementation                  |
| ------------------------ | ------------------------------- |
| **Soulbound Tokens**     | Transfers blocked after minting |
| **Role-Based Access**    | OpenZeppelin AccessControl      |
| **Hash Verification**    | SHA-256 file integrity checks   |
| **Duplicate Prevention** | Unique hash enforcement         |
| **Revocation Authority** | Only issuer or admin can revoke |

---

## 🐛 Troubleshooting

### Common Issues

| Issue                  | Solution                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| "Insufficient funds"   | Get test MATIC from [Polygon Faucet](https://faucet.polygon.technology/) |
| "Invalid private key"  | Check `.env` format - no quotes, no `0x` prefix                          |
| Transaction pending    | Check [Amoy PolygonScan](https://amoy.polygonscan.com/)                  |
| Contract calls failing | Verify `DEMO_MODE = false` and correct contract address                  |
| MetaMask wrong network | Switch to Polygon Amoy in MetaMask                                       |

### Debug Checklist

1. ✅ MetaMask connected to Polygon Amoy
2. ✅ Wallet has test MATIC
3. ✅ `DEMO_MODE = false` in constants.ts
4. ✅ Contract address is correct
5. ✅ Pinata API keys configured

---

## 🌐 Deployment

### Frontend Deployment

Deploy via Lovable:

1. Open your [Lovable project](https://lovable.dev)
2. Click **Share** → **Publish**

### Custom Domain

1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow DNS configuration instructions

[Read more about custom domains](https://docs.lovable.dev/features/custom-domain)

---

## 📜 Smart Contract Details

### Gas Estimates (Polygon)

| Operation           | Gas Units  | Cost (@ 30 gwei) |
| ------------------- | ---------- | ---------------- |
| Deploy              | ~2,500,000 | ~0.075 MATIC     |
| Approve Institution | ~80,000    | ~0.0024 MATIC    |
| Mint Certificate    | ~250,000   | ~0.0075 MATIC    |
| Revoke Certificate  | ~50,000    | ~0.0015 MATIC    |

### Contract Functions

| Function                    | Access            | Description                 |
| --------------------------- | ----------------- | --------------------------- |
| `approveInstitution()`      | Admin             | Approve institution to mint |
| `revokeInstitution()`       | Admin             | Revoke institution rights   |
| `mintCertificate()`         | Institution       | Issue new certificate       |
| `revokeCertificate()`       | Institution/Admin | Revoke a certificate        |
| `verifyCertificate()`       | Public            | Verify by token ID          |
| `verifyCertificateByHash()` | Public            | Verify by file hash         |

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

---

<p align="center">
  Built with ❤️ using <a href="https://lovable.dev">Lovable</a>
</p>
