import {
  CandyMachine,
  DefaultCandyGuardSettings,
  getMerkleProof,
  IdentitySigner,
  Metaplex,
  mintFromCandyMachineBuilder,
  MintLimitGuardSettings,
  Nft,
  NftBurnGuardSettings,
  NftGateGuardSettings,
  NftPaymentGuardSettings,
  NftWithToken,
  Pda,
  PublicKey,
  Sft,
  SftWithToken,
  SolAmount,
  SplTokenAmount,
  TokenBurnGuardSettings,
  TokenGateGuardSettings,
  TransactionBuilder,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AccountInfo } from "@solana/web3.js";
import React from "react";
import { MintCounterBorsh } from "../borsh/mintCounter";
import BN from "bn.js";

export type GuardGroup = {
  // address: PublicKey;
  startTime?: Date;
  endTime?: Date;
  payment?: SplTokenAmount | SolAmount;
  nftPayment?: NftPaymentGuardSettings;
  burn?: {
    token?: TokenBurnGuardSettings;
    nft?: NftBurnGuardSettings;
  };
  gate?: {
    token?: TokenGateGuardSettings;
    nft?: NftGateGuardSettings;
  };
  mintLimit?: {
    settings: MintLimitGuardSettings;
    pda?: Pda;
    accountInfo?: AccountInfo<Buffer>;
    mintCounter?: MintCounterBorsh; //MintCounter;
  };
  redeemLimit?: number;
  allowed?: PublicKey[];
  allowListMerkleRoot?: Uint8Array;
  gatekeeperNetwork?: PublicKey;
};

export type GuardGroupStates = {
  isStarted: boolean;
  isEnded: boolean;
  isPaymentAvailable: boolean;
  isLimitReached: boolean;
  isWalletWhitelisted: boolean;
  hasGatekeeper: boolean;
};

export default function useCandyMachineV3(candyMachineId: PublicKey | string) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [candyMachine, setCandyMachine] = React.useState<CandyMachine>(null);
  const [guards, setGuards] = React.useState<GuardGroup>({});
  const [guardGroups, setGuardGroups] = React.useState<
    { guards: GuardGroup; states: GuardGroupStates }[]
  >([]);
  const [guardStates, setGuardStates] = React.useState<GuardGroupStates>({
    isStarted: true,
    isEnded: false,
    isLimitReached: false,
    isPaymentAvailable: true,
    isWalletWhitelisted: true,
    hasGatekeeper: false,
  });
  const [status, setStatus] = React.useState({
    candyMachine: false,
    guardGroups: false,
    minting: false,
  });
  const [items, setItems] = React.useState({
    available: 0,
    remaining: 0,
    redeemed: 0,
  });

  const mx = React.useMemo(
    () => connection && Metaplex.make(connection),
    [connection]
  );

  const getPrice = React.useCallback(
    (guards: GuardGroup) => ({
      price: guards.payment
        ? guards.payment.basisPoints
            .div(new BN(10).pow(new BN(guards.payment.currency.decimals)))
            .toNumber()
        : guards.nftPayment
        ? 1
        : 0,
      label: guards.payment
        ? guards.payment.currency.symbol
        : guards.nftPayment
        ? "NFT"
        : "",
    }),
    []
  );

  const parseGuardGroup = React.useCallback(
    async (
      x: {
        label: string;
        guards: DefaultCandyGuardSettings;
      },
      candyMachine: CandyMachine,
      walletAddress: PublicKey
    ): Promise<GuardGroup> => {
      const guards: GuardGroup = {};

      // Check for start date
      if (x.guards?.startDate) {
        const date = new Date(x.guards.startDate.date.toNumber() * 1000);
        if (date.getTime() > Date.now()) {
          guards.startTime = date;
        } else {
          guards.startTime = null;
        }
      }

      // Check for end date
      if (x.guards?.endDate) {
        guards.endTime = new Date(x.guards.endDate.date.toNumber() * 1000);
      }

      // Check for mint limit
      if (x.guards.mintLimit) {
        guards.mintLimit = {
          settings: x.guards.mintLimit,
        };
        if (!guards.mintLimit.pda)
          guards.mintLimit.pda = await mx
            .candyMachines()
            .pdas()
            .mintLimitCounter({
              candyGuard: candyMachine.candyGuard.address,
              id: x.guards.mintLimit.id,
              candyMachine: candyMachine.address,
              user: walletAddress,
            });
        if (guards.mintLimit.pda) {
          guards.mintLimit.accountInfo = await connection.getAccountInfo(
            guards.mintLimit.pda
          );
          if (guards.mintLimit.accountInfo)
            guards.mintLimit.mintCounter = MintCounterBorsh.fromBuffer(
              guards.mintLimit.accountInfo.data
            );
        }
      }

      // Check for redeemed list
      if (x.guards.redeemedAmount) {
        guards.redeemLimit = x.guards.redeemedAmount.maximum.toNumber();
      }

      // Check for payment guards

      if (x.guards?.solPayment) {
        guards.payment = x.guards.solPayment.amount;
      }

      if (x.guards?.tokenPayment) {
        guards.payment = x.guards.tokenPayment.amount;
      }
      if (x.guards?.nftPayment) {
        guards.nftPayment = x.guards.nftPayment;
      }

      // Check for burn guards

      if (x.guards?.tokenBurn) {
        guards.burn = { token: x.guards.tokenBurn };
      }
      if (x.guards?.nftBurn) {
        guards.burn = { nft: x.guards.nftBurn };
      }

      // Check for gates

      if (x.guards?.tokenGate) {
        guards.gate = { token: x.guards.tokenGate };
      }
      if (x.guards?.nftGate) {
        guards.gate = { nft: x.guards.nftGate };
      }

      // Check for whitelisted addresses

      if (x.guards.addressGate || x.guards.allowList) {
        let allowed: PublicKey[] = [];

        if (x.guards.addressGate) allowed.push(x.guards.addressGate.address);

        if (x.guards.allowList) {
          guards.allowListMerkleRoot;
          // push wallet to allowed list if merkle verified
        }

        guards.allowed = allowed;
      }

      if (x.guards?.gatekeeper) {
        guards.gatekeeperNetwork = x.guards.gatekeeper.network;
      }

      return guards;
    },
    []
  );

  const parseGuardStates = React.useCallback(
    async (
      x: {
        label: string;
        guards: DefaultCandyGuardSettings;
      },
      candyMachine: CandyMachine,
      walletAddress: PublicKey
    ): Promise<GuardGroupStates> => {
      const guards: {} = {};
      const states: GuardGroupStates = {
        isStarted: true,
        isEnded: false,
        isLimitReached: false,
        isPaymentAvailable: true,
        isWalletWhitelisted: true,
        hasGatekeeper: false,
      };

      // Check for start date
      if (x.guards?.startDate) {
        states.isStarted =
          new Date(x.guards.startDate.date.toNumber() * 1000).getTime() <
          Date.now();
      }

      // Check for end date
      if (x.guards?.endDate) {
        states.isEnded =
          new Date(x.guards.endDate.date.toNumber() * 1000).getTime() <
          Date.now();
      }

      // Check for mint limit
      if (x.guards.mintLimit) {
        const mintLimiPda = await mx.candyMachines().pdas().mintLimitCounter({
          candyGuard: candyMachine.candyGuard.address,
          id: x.guards.mintLimit.id,
          candyMachine: candyMachine.address,
          user: walletAddress,
        });

        let mintCount = 0;
        if (mintLimiPda) {
          const mintLimitAccountInfo = await connection.getAccountInfo(
            mintLimiPda
          );
          if (mintLimitAccountInfo)
            mintCount = MintCounterBorsh.fromBuffer(
              mintLimitAccountInfo.data
            ).count;
        }

        states.isLimitReached = x.guards.mintLimit?.limit
          ? x.guards.mintLimit?.limit === mintCount
          : false;
      }

      // Check for redeemed list
      if (x.guards.redeemedAmount) {
        states.isLimitReached = x.guards.redeemedAmount.maximum.eq(
          candyMachine.itemsMinted
        );
      }

      // Check for payment guards

      if (x.guards?.solPayment) {
        const balance = await mx.rpc().getBalance(walletAddress);
        states.isPaymentAvailable = balance.basisPoints.gte(
          x.guards.solPayment.amount.basisPoints
        );
      }

      if (x.guards?.tokenPayment) {
        const tokenAccount = await mx.tokens().findTokenWithMintByMint({
          addressType: "owner",
          address: walletAddress,
          mint: x.guards.tokenPayment.tokenMint,
        });
        states.isPaymentAvailable =
          !!tokenAccount &&
          tokenAccount.amount.basisPoints.gte(
            x.guards.tokenPayment.amount.basisPoints
          );
      }
      if (x.guards?.nftPayment) {
        const tokenAccounts = await mx.nfts().findAllByOwner({
          owner: walletAddress,
        });
        if (tokenAccounts && tokenAccounts.length) {
          states.isPaymentAvailable = !!tokenAccounts.find((y) =>
            y.collection.address.equals(x.guards.nftPayment.requiredCollection)
          );
        } else {
          states.isPaymentAvailable = false;
        }
      }

      // Check for burn guards

      if (x.guards?.tokenBurn) {
        const tokenAccount = await mx.tokens().findTokenWithMintByMint({
          addressType: "owner",
          address: walletAddress,
          mint: x.guards.tokenBurn.mint,
        });
        states.isPaymentAvailable =
          !!tokenAccount &&
          tokenAccount.amount.basisPoints.gte(
            x.guards.tokenBurn.amount.basisPoints
          );
      }
      if (x.guards?.nftBurn) {
        const tokenAccounts = await mx.nfts().findAllByOwner({
          owner: walletAddress,
        });
        if (tokenAccounts && tokenAccounts.length) {
          states.isPaymentAvailable = !!tokenAccounts.find((y) =>
            y.collection.address.equals(x.guards.nftBurn.requiredCollection)
          );
        } else {
          states.isPaymentAvailable = false;
        }
      }

      // Check for gates

      if (x.guards?.tokenGate) {
        const tokenAccount = await mx.tokens().findTokenWithMintByMint({
          addressType: "owner",
          address: walletAddress,
          mint: x.guards.tokenPayment.tokenMint,
        });
        states.isPaymentAvailable =
          !!tokenAccount &&
          tokenAccount.amount.basisPoints.gte(
            x.guards.tokenGate.amount.basisPoints
          );
      }
      if (x.guards?.nftGate) {
        const tokenAccounts = await mx.nfts().findAllByOwner({
          owner: walletAddress,
        });
        if (tokenAccounts && tokenAccounts.length) {
          states.isPaymentAvailable = !!tokenAccounts.find((y) =>
            y.collection.address.equals(x.guards.nftGate.requiredCollection)
          );
        } else {
          states.isPaymentAvailable = false;
        }
      }

      // Check for whitelisted addresses

      if (x.guards.addressGate || x.guards.allowList) {
        let allowed: PublicKey[] = [];

        if (x.guards.addressGate) allowed.push(x.guards.addressGate.address);

        if (x.guards.allowList) {
          // push wallet to allowed list if merkle verified
        }
        states.isWalletWhitelisted = !!allowed.find((x) =>
          x.equals(walletAddress)
        );
      }

      if (x.guards?.gatekeeper) {
        states.hasGatekeeper = true;
      }

      return states;
    },
    []
  );

  const fetchCandyMachine = React.useCallback(async () => {
    return await mx.candyMachines().findByAddress({
      address: new PublicKey(candyMachineId),
    });
  }, [candyMachineId]);

  const fetchGuardGroups = React.useCallback(
    async (
      candyMachine: CandyMachine,
      walletAddress: PublicKey
    ): Promise<{ guards: GuardGroup; states: GuardGroupStates }[]> => {
      return await Promise.all(
        candyMachine.candyGuard.groups.map(async (x) => ({
          guards: await parseGuardGroup(x, candyMachine, walletAddress),
          states: await parseGuardStates(x, candyMachine, walletAddress),
        }))
      );
    },
    [parseGuardGroup]
  );

  const refresh = React.useCallback(async () => {
    if (!wallet.publicKey) throw new Error("Wallet not loaded yet!");
    const walletAddress = wallet.publicKey;

    setStatus((x) => ({ ...x, candyMachine: true }));
    await fetchCandyMachine()
      .then((cndy) => {
        console.log("cndy", cndy);
        setCandyMachine(cndy);
        setItems({
          available: cndy.itemsAvailable.toNumber(),
          remaining: cndy.itemsRemaining.toNumber(),
          redeemed: cndy.itemsMinted.toNumber(),
        });

        parseGuardGroup(
          { label: "", guards: cndy.candyGuard.guards },
          candyMachine,
          walletAddress
        )
          .then(setGuards)
          .catch((e) => console.error("Error while fetching default guard", e));

        parseGuardStates(
          { label: "", guards: cndy.candyGuard.guards },
          candyMachine,
          walletAddress
        )
          .then(setGuardStates)
          .catch((e) => console.error("Error while fetching default guard", e));

        return cndy;
      })
      .catch((e) => console.error("Error while fetching candy machine", e))
      .finally(() => setStatus((x) => ({ ...x, candyMachine: false })));
  }, [fetchCandyMachine, wallet.publicKey]);

  React.useEffect(() => {
    if (!mx || !wallet.publicKey) return;
    mx.use(walletAdapterIdentity(wallet));
    // mx.rpc().sendAndConfirmTransaction(aa as any,{skipPreflight: true})
  }, [mx, wallet.publicKey]);

  React.useEffect(() => {
    refresh().catch((e) =>
      console.error("Error while fetching candy machine", e)
    );
  }, [refresh]);

  React.useEffect(() => {
    if (!candyMachine || !wallet.publicKey) return;

    setStatus((x) => ({ ...x, guardGroups: true }));
    fetchGuardGroups(candyMachine, wallet.publicKey)
      .then(setGuardGroups)
      .catch((e) => "Error while fetching gaurd groups")
      .finally(() => setStatus((x) => ({ ...x, guardGroups: false })));
  }, [candyMachine, wallet.publicKey]);

  const mint = React.useCallback(
    async (quantityString: number = 1) => {
      let nfts: (Sft | SftWithToken | Nft | NftWithToken)[] = [];
      try {
        if (!candyMachine) throw new Error("Candy Machine not loaded yet!");

        setStatus((x) => ({ ...x, minting: true }));

        const transactionBuilders: TransactionBuilder[] = [];
        for (let index = 0; index < quantityString; index++) {
          transactionBuilders.push(
            await mintFromCandyMachineBuilder(mx, {
              candyMachine,
              collectionUpdateAuthority: candyMachine.authorityAddress, // mx.candyMachines().pdas().authority({candyMachine: candyMachine.address})
            })
          );
        }
        const blockhash = await mx.rpc().getLatestBlockhash();

        const transactions = transactionBuilders.map((t) =>
          t.toTransaction(blockhash)
        );
        const signers: { [k: string]: IdentitySigner } = {};
        transactions.forEach((tx, i) => {
          tx.feePayer = wallet.publicKey;
          tx.recentBlockhash = blockhash.blockhash;
          transactionBuilders[i].getSigners().forEach((s) => {
            if ("signAllTransactions" in s) signers[s.publicKey.toString()] = s;
            else if ("secretKey" in s) tx.partialSign(s);
            // @ts-ignore
            else if ("_signer" in s) tx.partialSign(s._signer);
          });
        });
        let signedTransactions = transactions;

        for (let signer in signers) {
          await signers[signer].signAllTransactions(transactions);
        }

        const output = await Promise.all(
          signedTransactions.map((tx, i) => {
            return mx
              .rpc()
              .sendAndConfirmTransaction(tx, { commitment: "finalized" })
              .then((tx) => ({
                ...tx,
                context: transactionBuilders[i].getContext() as any,
              }));
          })
        );
        // console.log(output.map(({ context }) => context));
        nfts = await Promise.all(
          output.map(({ context }) =>
            mx.nfts().findByMint({
              mintAddress: context.mintSigner.publicKey,
              tokenAddress: context.tokenAddress,
            })
          )
        );

        if (guards.mintLimit?.mintCounter)
          guards.mintLimit.mintCounter.count += nfts.length;

        setItems((x) => ({
          ...x,
          remaining: x.remaining - nfts.length,
          redeemed: x.redeemed + nfts.length,
        }));
      } catch (error: any) {
        let message = error.msg || "Minting failed! Please try again!";
        if (!error.msg) {
          if (!error.message) {
            message = "Transaction Timeout! Please try again.";
          } else if (error.message.indexOf("0x138")) {
          } else if (error.message.indexOf("0x137")) {
            message = `SOLD OUT!`;
          } else if (error.message.indexOf("0x135")) {
            message = `Insufficient funds to mint. Please fund your wallet.`;
          }
        } else {
          if (error.code === 311) {
            message = `SOLD OUT!`;
          } else if (error.code === 312) {
            message = `Minting period hasn't started yet.`;
          }
        }
        throw new Error(message);
      } finally {
        setStatus((x) => ({ ...x, minting: false }));
        return nfts;
      }
    },
    [candyMachine, guards, mx]
  );

  return {
    candyMachine,
    guards,
    guardStates,
    guardGroups,
    status,
    items,
    mint,
    refresh,
    getPrice,
  };
}
