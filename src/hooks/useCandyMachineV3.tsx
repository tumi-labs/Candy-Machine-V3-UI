import {
  CandyMachine,
  DefaultCandyGuardSettings,
  IdentitySigner,
  Metadata,
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
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import React from "react";
import { MintCounterBorsh } from "../borsh/mintCounter";
import BN from "bn.js";

export type Token = {
  mint: PublicKey;
  balance: number;
  decimals: number;
};

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

  const [balance, setBalance] = React.useState(0);
  const [allTokens, setAllTokens] = React.useState<Token[]>([]);
  const [nftHoldings, setNftHoldings] = React.useState<(Nft | Metadata)[]>([]);
  const [tokenHoldings, setTokenHoldings] = React.useState<Token[]>([]);

  const [candyMachine, setCandyMachine] = React.useState<CandyMachine>(null);
  const [guards, setGuards] = React.useState<GuardGroup>({});
  const [guardGroups, setGuardGroups] = React.useState<
    { label: string; guards: GuardGroup; states: GuardGroupStates }[]
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
      guards: DefaultCandyGuardSettings,
      candyMachine: CandyMachine,
      walletAddress: PublicKey
    ): Promise<GuardGroup> => {
      const guardsParsed: GuardGroup = {};

      // Check for start date
      if (guards.startDate) {
        const date = new Date(guards.startDate.date.toNumber() * 1000);
        if (date.getTime() > Date.now()) {
          guardsParsed.startTime = date;
        } else {
          guardsParsed.startTime = null;
        }
      }

      // Check for end date
      if (guards.endDate) {
        guardsParsed.endTime = new Date(guards.endDate.date.toNumber() * 1000);
      }

      // Check for mint limit
      if (guards.mintLimit) {
        guardsParsed.mintLimit = {
          settings: guards.mintLimit,
        };
        if (!guardsParsed.mintLimit.pda)
          guardsParsed.mintLimit.pda = await mx
            .candyMachines()
            .pdas()
            .mintLimitCounter({
              candyGuard: candyMachine.candyGuard.address,
              id: guards.mintLimit.id,
              candyMachine: candyMachine.address,
              user: walletAddress,
            });
        if (guardsParsed.mintLimit.pda) {
          guardsParsed.mintLimit.accountInfo = await connection.getAccountInfo(
            guardsParsed.mintLimit.pda
          );
          if (guardsParsed.mintLimit.accountInfo)
            guardsParsed.mintLimit.mintCounter = MintCounterBorsh.fromBuffer(
              guardsParsed.mintLimit.accountInfo.data
            );
        }
      }

      // Check for redeemed list
      if (guards.redeemedAmount) {
        guardsParsed.redeemLimit = guards.redeemedAmount.maximum.toNumber();
      }

      // Check for payment guards

      if (guards.solPayment) {
        guardsParsed.payment = guards.solPayment.amount;
      }

      if (guards.tokenPayment) {
        guardsParsed.payment = guards.tokenPayment.amount;
      }
      if (guards.nftPayment) {
        guardsParsed.nftPayment = guards.nftPayment;
      }

      // Check for burn guards

      if (guards.tokenBurn) {
        guardsParsed.burn = { token: guards.tokenBurn };
      }
      if (guards.nftBurn) {
        guardsParsed.burn = { nft: guards.nftBurn };
      }

      // Check for gates

      if (guards.tokenGate) {
        guardsParsed.gate = { token: guards.tokenGate };
      }
      if (guards.nftGate) {
        guardsParsed.gate = { nft: guards.nftGate };
      }

      // Check for whitelisted addresses

      if (guards.addressGate || guards.allowList) {
        let allowed: PublicKey[] = [];

        if (guards.addressGate) allowed.push(guards.addressGate.address);

        if (guards.allowList) {
          guards.allowListMerkleRoot;
          // push wallet to allowed list if merkle verified
        }

        guardsParsed.allowed = allowed;
      }

      if (guards.gatekeeper) {
        guardsParsed.gatekeeperNetwork = guards.gatekeeper.network;
      }

      return guardsParsed;
    },
    []
  );

  const parseGuardStates = React.useCallback(
    async (
      guards: DefaultCandyGuardSettings,
      candyMachine: CandyMachine,
      walletAddress: PublicKey
    ): Promise<GuardGroupStates> => {
      const states: GuardGroupStates = {
        isStarted: true,
        isEnded: false,
        isLimitReached: false,
        isPaymentAvailable: true,
        isWalletWhitelisted: true,
        hasGatekeeper: false,
      };

      // Check for start date
      if (guards.startDate) {
        states.isStarted =
          new Date(guards.startDate.date.toNumber() * 1000).getTime() <
          Date.now();
      }

      // Check for end date
      if (guards.endDate) {
        states.isEnded =
          new Date(guards.endDate.date.toNumber() * 1000).getTime() <
          Date.now();
      }

      // Check for mint limit
      if (guards.mintLimit) {
        const mintLimiPda = await mx.candyMachines().pdas().mintLimitCounter({
          candyGuard: candyMachine.candyGuard.address,
          id: guards.mintLimit.id,
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

        states.isLimitReached = guards.mintLimit?.limit
          ? guards.mintLimit?.limit === mintCount
          : false;
      }

      // Check for redeemed list
      if (guards.redeemedAmount) {
        states.isLimitReached = guards.redeemedAmount.maximum.eq(
          candyMachine.itemsMinted
        );
      }

      // Check for payment guards

      if (guards.solPayment) {
        states.isPaymentAvailable = guards.solPayment.amount.basisPoints.gte(
          new BN(balance)
        );
      }

      if (guards.tokenPayment) {
        const tokenAccount = tokenHoldings.find((x) =>
          x.mint.equals(guards.tokenPayment.tokenMint)
        );
        states.isPaymentAvailable =
          !!tokenAccount &&
          guards.tokenPayment.amount.basisPoints.lte(
            new BN(tokenAccount.balance)
          );
      }

      if (guards.nftPayment) {
        states.isPaymentAvailable = !!nftHoldings.find((y) =>
          y.collection?.address.equals(guards.nftPayment.requiredCollection)
        );
      }

      // Check for burn guards

      if (guards.tokenBurn) {
        const tokenAccount = tokenHoldings.find(
          (x) => x.mint.toString() === guards.tokenBurn.mint.toString()
        );
        states.isPaymentAvailable =
          !!tokenAccount &&
          guards.tokenBurn.amount.basisPoints.lte(new BN(tokenAccount.balance));
      }

      if (guards.nftBurn) {
        states.isPaymentAvailable = !!nftHoldings.find((y) =>
          y.collection?.address.equals(guards.nftBurn.requiredCollection)
        );
      }

      // Check for gates

      if (guards.tokenGate) {
        const tokenAccount = tokenHoldings.find((x) =>
          x.mint.equals(guards.tokenGate.mint)
        );
        states.isPaymentAvailable =
          !!tokenAccount &&
          guards.tokenGate.amount.basisPoints.lte(new BN(tokenAccount.balance));
      }

      if (guards.nftGate) {
        states.isPaymentAvailable = !!nftHoldings.find((y) =>
          y.collection?.address.equals(guards.nftGate.requiredCollection)
        );
      }

      // Check for whitelisted addresses

      if (guards.addressGate || guards.allowList) {
        let allowed: PublicKey[] = [];

        if (guards.addressGate) allowed.push(guards.addressGate.address);

        if (guards.allowList) {
          // push wallet to allowed list if merkle verified
        }
        states.isWalletWhitelisted = !!allowed.find((x) =>
          x.equals(walletAddress)
        );
      }

      if (guards.gatekeeper) {
        states.hasGatekeeper = true;
      }

      return states;
    },
    [tokenHoldings, nftHoldings]
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
    ): Promise<
      { label: string; guards: GuardGroup; states: GuardGroupStates }[]
    > => {
      const groups = await Promise.all(
        candyMachine.candyGuard.groups.map(async (x) => {
          const group = {
            label: x.label,
            guards: await parseGuardGroup(
              x.guards,
              candyMachine,
              walletAddress
            ),
            states: await parseGuardStates(
              x.guards,
              candyMachine,
              walletAddress
            ),
          };
          return group;
        })
      );
      return groups;
    },
    [parseGuardGroup, parseGuardStates]
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

        parseGuardGroup(cndy.candyGuard.guards, candyMachine, walletAddress)
          .then(setGuards)
          .catch((e) => console.error("Error while fetching default guard", e));

        parseGuardStates(cndy.candyGuard.guards, candyMachine, walletAddress)
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

    mx.rpc()
      .getBalance(wallet.publicKey)
      .then((x) => x.basisPoints.toNumber())
      .then(setBalance)
      .catch((e) => console.error("Error to fetch wallet balance", e));

    mx.nfts()
      .findAllByOwner({
        owner: wallet.publicKey,
      })
      .then((x) => setNftHoldings(x as any[]))
      .catch((e) => console.error("Failed to fetch wallet nft holdings", e));

    (async (walletAddress: PublicKey): Promise<Token[]> => {
      const tokenAccounts = (
        await connection.getParsedTokenAccountsByOwner(walletAddress, {
          programId: TOKEN_PROGRAM_ID,
        })
      ).value.filter(
        (x) => parseInt(x.account.data.parsed.info.tokenAmount.amount) > 1
      );

      return tokenAccounts.map((x) => ({
        mint: new PublicKey(x.account.data.parsed.info.mint),
        balance: parseInt(x.account.data.parsed.info.tokenAmount.amount),
        decimals: x.account.data.parsed.info.tokenAmount.decimals,
      }));
    })(wallet.publicKey).then(setAllTokens);
  }, [mx, wallet.publicKey]);

  React.useEffect(() => {
    if (!nftHoldings.length || !allTokens.length) return;
    setTokenHoldings(
      allTokens.filter(
        (x) => !nftHoldings.find((y) => x.mint.equals(y.address))
      )
    );
  }, [nftHoldings, allTokens]);

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
  }, [candyMachine, wallet.publicKey, fetchGuardGroups]);

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
