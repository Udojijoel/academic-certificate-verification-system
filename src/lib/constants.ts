// ===========================================
// DEPLOY CONFIGURATION - UPDATE AFTER DEPLOYMENT
// ===========================================

// Set to false after deploying your contract to enable real blockchain interactions
export const DEMO_MODE = false;

// Contract addresses - update after deployment
export const CONTRACT_ADDRESSES = {
  // Polygon Amoy Testnet
  amoy: "0xdF819964Ac265Abbb005C407AeC609BE9797057F",
  // Polygon Mainnet - For production deployment
  mainnet: "0xdF819964Ac265Abbb005C407AeC609BE9797057F",
};

// Network configurations
export const NETWORKS = {
  amoy: {
    chainId: "0x13882", // 80002 in hex
    chainIdDecimal: 80002,
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
  },
  mainnet: {
    chainId: "0x89", // 137 in hex
    chainIdDecimal: 137,
    chainName: "Polygon Mainnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
};

// Default network
export const DEFAULT_NETWORK = "amoy" as const;

// IPFS Gateway
export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
