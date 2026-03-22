"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { useAuthStore } from "@/lib/auth-store";

export interface WalletState {
  address: string | null;
  balance: string | null;   // ETH
  balanceUsd: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

interface Ethereum {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isConnected?: boolean;
  selectedAddress?: string | null;
}

declare global {
  interface Window {
    ethereum?: Ethereum;
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    balanceUsd: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const { token } = useAuthStore();

  const saveWalletToBackend = useCallback(
    async (address: string) => {
      if (!token) return;
      try {
        await fetch("/api/web3/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address }),
        });
      } catch {
        // Non-critical
      }
    },
    [token]
  );

  const fetchBalance = useCallback(async (address: string) => {
    if (!window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const rawBalance = await provider.getBalance(address);
      const ethBalance = parseFloat(formatEther(rawBalance));
      // Rough USD conversion (1 ETH ≈ $2000)
      const ethUsd = ethBalance * 2000;
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      setState((prev) => ({
        ...prev,
        balance: ethBalance.toFixed(4),
        balanceUsd: ethUsd.toFixed(2),
        chainId,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        balance: null,
        balanceUsd: null,
      }));
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((prev) => ({ ...prev, error: "MetaMask not installed" }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = (await window.ethereum!.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned");
      }

      const address = accounts[0];
      setState((prev) => ({ ...prev, address, isConnecting: false }));
      await saveWalletToBackend(address);
      await fetchBalance(address);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection rejected";
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          msg.includes("User rejected") || msg.includes("User denied")
            ? "Connection rejected by user"
            : msg,
      }));
    }
  }, [fetchBalance, saveWalletToBackend]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: null,
      balanceUsd: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  // Listen for MetaMask account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnect();
      } else {
        setState((prev) => ({ ...prev, address: accs[0] }));
        fetchBalance(accs[0]);
      }
    };

    const handleChainChanged = () => {
      if (state.address) fetchBalance(state.address);
    };

    window.ethereum!.on("accountsChanged", handleAccountsChanged);
    window.ethereum!.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [state.address, disconnect, fetchBalance]);

  return { ...state, connect, disconnect };
}
