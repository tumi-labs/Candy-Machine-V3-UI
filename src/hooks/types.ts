import {
  DefaultCandyGuardMintSettings,
  Metadata,
  MintLimitGuardSettings,
  Pda,
} from "@metaplex-foundation/js";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { MintCounterBorsh } from "../borsh/mintCounter";

export type Token = {
  mint: PublicKey;
  balance: number;
  decimals: number;
};
export type TokenPayment$Gate = {
  mint: PublicKey;
  amount: number;
  symbol?: string;
  decimals: number;
};
export type GuardGroup = {
  // address: PublicKey;
  startTime?: Date;
  endTime?: Date;
  payment?: {
    sol?: {
      amount: number;
      decimals: number;
    };
    token?: TokenPayment$Gate;
    nfts?: Metadata[];
  };
  burn?: {
    token?: TokenPayment$Gate;
    nfts?: Metadata[];
  };
  gate?: {
    token?: TokenPayment$Gate;
    nfts?: Metadata[];
  };
  mintLimit?: MintLimitLogics;
  redeemLimit?: number;
  allowed?: PublicKey[];
  allowList?: Uint8Array;
  gatekeeperNetwork?: PublicKey;
};
export type MintLimitLogics = {
  settings: MintLimitGuardSettings;
  pda?: Pda;
  accountInfo?: AccountInfo<Buffer>;
  mintCounter?: MintCounterBorsh; //MintCounter;
};
export type GuardGroupStates = {
  isStarted: boolean;
  isEnded: boolean;
  isPaymentAvailable: boolean;
  isLimitReached: boolean;
  isWalletWhitelisted: boolean;
  hasGatekeeper: boolean;
};

export type PaymentRequired = {
  label: string;
  price: number;
  mint?: PublicKey;
  decimals?: number;
  kind: string;
};
export type ParsedPricesForUI = {
  payment: PaymentRequired[];
  burn: PaymentRequired[];
  gate: PaymentRequired[];
};

export declare type CustomCandyGuardMintSettings = Partial<
  DefaultCandyGuardMintSettings & {
    allowList: {
      proof: Uint8Array[];
    };
  }
>;

export type AllowLists = {
  groupLabel?: string;
  list: (string | Uint8Array)[];
}[];
