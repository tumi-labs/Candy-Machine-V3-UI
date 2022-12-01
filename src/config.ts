import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

export const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
  WalletAdapterNetwork.Devnet) as WalletAdapterNetwork;
// const network = WalletAdapterNetwork.Devnet;
export const rpcHost =
  process.env.NEXT_PUBLIC_RPC_HOST || clusterApiUrl(network);

export const candyMachineId = new PublicKey(
  process.env.NEXT_PUBLIC_CANDY_MACHINE_ID ||
    "43CrRZaEHbkCVdBSikbBFz7Jbrth5uTpsavNNW3FoQVT"
);
export const defaultGuardGroup =
  process.env.NEXT_PUBLIC_DEFAULT_GUARD_GROUP || undefined; // undefined means default

export const whitelistedWallets = [
  "HHWnihfANXc78ESGG7RbVeC1xyKtvr6FEoKY3aHqDLfS",
  "MoneYRVRNs2MFNPo94YDV5TsPRFsiakkkBmS8aL8jHS",
  "Cxcfw2GC1tfEPEuNABNwTujwr6nEtsV6Enzjxz2pDqoE",
  "BwgpxJAFX9wtZSWxp3JUd65aky6a6N8F5xMqBfA39ohL",
  "B6amNHGxzvPxwbFR7h2k7SndrjdkqD5JhtmvCkH6wCmT",
];
