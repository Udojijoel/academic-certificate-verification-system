import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { NETWORKS, DEFAULT_NETWORK } from "@/lib/constants";

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    provider: null,
    signer: null,
  });

  const targetNetwork = NETWORKS[DEFAULT_NETWORK];

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum;

  // Switch to the correct network
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetNetwork.chainId }],
      });
    } catch (switchError: any) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: targetNetwork.chainId,
              chainName: targetNetwork.chainName,
              nativeCurrency: targetNetwork.nativeCurrency,
              rpcUrls: targetNetwork.rpcUrls,
              blockExplorerUrls: targetNetwork.blockExplorerUrls,
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, [targetNetwork]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setState((prev) => ({
        ...prev,
        error: "Please install MetaMask to connect your wallet",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get current chain
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Switch to correct network if needed
      if (currentChainId !== targetNetwork.chainIdDecimal) {
        await switchNetwork();
        // Re-initialize provider after network switch
        const newProvider = new BrowserProvider(window.ethereum);
        const signer = await newProvider.getSigner();
        
        setState({
          address: accounts[0],
          chainId: targetNetwork.chainIdDecimal,
          isConnected: true,
          isConnecting: false,
          error: null,
          provider: newProvider,
          signer,
        });
      } else {
        const signer = await provider.getSigner();
        
        setState({
          address: accounts[0],
          chainId: currentChainId,
          isConnected: true,
          isConnecting: false,
          error: null,
          provider,
          signer,
        });
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Failed to connect wallet",
      }));
    }
  }, [isMetaMaskInstalled, switchNetwork, targetNetwork.chainIdDecimal]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      provider: null,
      signer: null,
    });
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        connect();
      }
    };

    const handleChainChanged = () => {
      // Reload page on chain change as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [isMetaMaskInstalled, state.address, connect, disconnect]);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    isMetaMaskInstalled,
    formatAddress,
    networkName: targetNetwork.chainName,
  };
}

// Add ethereum type to window
declare global {
  interface Window {
    ethereum?: any;
  }
}
