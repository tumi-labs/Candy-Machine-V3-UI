import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

export const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
  WalletAdapterNetwork.Devnet) as WalletAdapterNetwork;
// const network = WalletAdapterNetwork.Devnet;
export const rpcHost =
  process.env.NEXT_PUBLIC_RPC_HOST || clusterApiUrl(network);

export const candyMachineId = new PublicKey(
  process.env.NEXT_PUBLIC_CANDY_MACHINE_ID ||
    "Cuqr6zL1my6VqLDJFYpDYPxdGYdCp9GN3MrnhkCMfoG6"
);
export const defaultGuardGroup =
  process.env.NEXT_PUBLIC_DEFAULT_GUARD_GROUP || undefined; // undefined means default

// "qasJ6jhgtngKk2QnEPdDjuFH8NMoM58W8TxPBXAChPY"
// "3zwFR3spiwbSSMtvVKG2bRT6ttqFoC3MHCafGP8ZrdLz"
// "DAA8yRLu7acVs3kxaTyCjoEjNWGinLaCKVhDY29ASNua"

export const whitelistedWallets = [
  "CejSuY4VTJoMNCGUzQw7W55BBu9ahDazC6s2PKYbZ3DV",
  "2qTwXXNi7XPRHgcEjQMPywxVmyps2RWQcbKLMY5C9XvE",
  "ARhwtjysfEt53PJZpu481DxZNmdKT9gMGonbUwJfkJZe",
  "9oQ983SYnWiFXY5r6kvvD6VJvKsmcS39zVLAY43jD7Aw",
  "82aw7W1zH9VsT7dXzhH6bMPGVFiWAUWkpgx8pEgud8EL",
  "pErLXusjgZkDJT9126Mb8hp8NZxmJoGniA6WEMPpNhb",
  "CM1h4zABFNvZs5vt3SiNghHBjaf2cVbZAR6pZzXZNUT7",
  "HXNWdTkeX1wLNzxrccBBrdXf8S84LQa88b3HfH8PJA46",
  "8R1jQHRLdh9GorFkXcNam9RyJTVPMmmFuzuVZLWh3NxB",
  "5QpQNJDfCLHTWDErmWtHLv6dWs6Vq4vhDX8Lkxmv8QSb",
  "8q8PDKsqhhVCDQZAoaaXnvLV1nqQp8hM2UgBJjEKGZJm"
];
