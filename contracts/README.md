# CertChain Smart Contracts

Soulbound Academic Certificate NFTs on Polygon Network.

## Features

- **Soulbound Tokens**: Non-transferable certificates that stay with the student forever
- **Institution Access Control**: Only approved institutions can mint certificates
- **Certificate Verification**: Verify by token ID or file hash
- **Revocation System**: Institutions can revoke certificates with reason
- **Gas Optimized**: Designed for Polygon's low-cost transactions

## Contract Overview

### CertChainSBT.sol

Main contract implementing ERC-721 with soulbound restrictions.

#### Roles
- `ADMIN_ROLE`: Can approve/revoke institutions
- `INSTITUTION_ROLE`: Approved institutions can mint certificates

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `approveInstitution()` | Admin | Approve an institution to mint |
| `revokeInstitution()` | Admin | Revoke institution's minting rights |
| `mintCertificate()` | Institution | Mint a new certificate NFT |
| `revokeCertificate()` | Institution/Admin | Revoke a certificate |
| `verifyCertificate()` | Public | Verify certificate by token ID |
| `verifyCertificateByHash()` | Public | Verify certificate by file hash |

## Deployment

### Prerequisites

```bash
npm install --save-dev hardhat @openzeppelin/contracts
```

### Network Configuration

Add to `hardhat.config.js`:

```javascript
module.exports = {
  solidity: "0.8.21",
  networks: {
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002,
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 137,
    },
  },
};
```

### Deploy Script

```javascript
const { ethers } = require("hardhat");

async function main() {
  const CertChainSBT = await ethers.getContractFactory("CertChainSBT");
  const contract = await CertChainSBT.deploy();
  await contract.deployed();
  
  console.log("CertChainSBT deployed to:", contract.address);
}

main().catch(console.error);
```

### Deploy Commands

```bash
# Compile
npx hardhat compile

# Deploy to Amoy Testnet
npx hardhat run scripts/deploy.js --network polygonAmoy

# Deploy to Polygon Mainnet
npx hardhat run scripts/deploy.cjs --network polygon

# Verify on PolygonScan
npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS>
```

## Usage Examples

### Approve Institution

```javascript
await contract.approveInstitution(
  "0x1234...", // Institution wallet
  "Stanford University",
  "United States"
);
```

### Mint Certificate

```javascript
await contract.mintCertificate(
  "0x5678...", // Student wallet
  "John Doe",
  "Bachelor of Computer Science",
  "QmXyz123...", // IPFS CID
  "0xabc123...", // SHA-256 hash
  "ipfs://QmMetadata..." // Token URI
);
```

### Verify Certificate

```javascript
const [isValid, certificate] = await contract.verifyCertificate(1);
console.log("Valid:", isValid);
console.log("Student:", certificate.studentName);
console.log("Degree:", certificate.degreeName);
```

## Gas Estimates (Polygon)

| Operation | Gas Units | Cost (@ 30 gwei) |
|-----------|-----------|------------------|
| Deploy | ~2,500,000 | ~0.075 MATIC |
| Approve Institution | ~80,000 | ~0.0024 MATIC |
| Mint Certificate | ~250,000 | ~0.0075 MATIC |
| Revoke Certificate | ~50,000 | ~0.0015 MATIC |

## Security Considerations

1. **Access Control**: Uses OpenZeppelin's AccessControl for role management
2. **Soulbound**: Transfers are blocked except for minting
3. **Hash Uniqueness**: Prevents duplicate certificates
4. **Revocation**: Only issuing institution or admin can revoke

## License

MIT
