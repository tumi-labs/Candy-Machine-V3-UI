import {
  CandyMachine,
  DefaultCandyGuardMintSettings,
  DefaultCandyGuardSettings,
  getMerkleProof,
  IdentitySigner,
  Metadata,
  Metaplex,
  mintFromCandyMachineBuilder,
  MintLimitGuardSettings,
  Nft,
  NftWithToken,
  Pda,
  PublicKey,
  Sft,
  SftWithToken,
  toBigNumber,
  TransactionBuilder,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AccountInfo, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import React from "react";
import { MintCounterBorsh } from "../borsh/mintCounter";
import { MerkleTree } from "../helpers";

export type Token = {
  mint: PublicKey;
  balance: number;
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
    token?: {
      mint: PublicKey;
      amount: number;
      decimals: number;
    };
    nfts?: Metadata[];
  };
  burn?: {
    token?: {
      mint: PublicKey;
      amount: number;
      decimals: number;
    };
    nfts?: Metadata[];
  };
  gate?: {
    token?: {
      mint: PublicKey;
      amount: number;
      decimals: number;
    };
    nfts?: Metadata[];
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

export default function useCandyMachineV3(
  candyMachineId: PublicKey | string,
  candyMachineOpts: {
    whitelistedWallets?: PublicKey[];
  } = {}
) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const whitelistWalletsTree = React.useMemo(() => {
    return new MerkleTree(candyMachineOpts.whitelistedWallets);
  }, [candyMachineOpts.whitelistedWallets]);

  const [status, setStatus] = React.useState({
    candyMachine: false,
    guardGroups: false,
    minting: false,
  });

  const [balance, setBalance] = React.useState(0);
  const [allTokens, setAllTokens] = React.useState<Token[]>([]);
  const [nftHoldings, setNftHoldings] = React.useState<Metadata[]>([]);

  const tokenHoldings = React.useMemo<Token[]>(() => {
    if (!nftHoldings.length || !allTokens.length) return [];
    return allTokens.filter(
      (x) => !nftHoldings.find((y) => x.mint.equals(y.address))
    );
  }, [nftHoldings, allTokens]);

  const [candyMachine, setCandyMachine] = React.useState<CandyMachine>(null);
  const [items, setItems] = React.useState({
    available: 0,
    remaining: 0,
    redeemed: 0,
  });

  const [guards, setGuards] = React.useState<GuardGroup>({});
  const [guardStates, setGuardStates] = React.useState<GuardGroupStates>({
    isStarted: true,
    isEnded: false,
    isLimitReached: false,
    isPaymentAvailable: true,
    isWalletWhitelisted: true,
    hasGatekeeper: false,
  });

  const [guardGroups, setGuardGroups] = React.useState<
    { label: string; guards: GuardGroup; states: GuardGroupStates }[]
  >([]);

  const mx = React.useMemo(
    () => connection && Metaplex.make(connection),
    [connection]
  );

  const getPrice = React.useCallback((guards: GuardGroup) => {
    return {
      price:
        guards.payment &&
        (guards.payment.sol || guards.payment.token || guards.payment.nfts)
          ? guards.payment.sol || guards.payment.token
            ? (guards.payment.sol?.amount || guards.payment.token.amount || 0) /
              10 ** (guards.payment.sol || guards.payment.token).decimals
            : guards.payment.nfts
            ? 1
            : 0
          : 0,
      label:
        guards.payment &&
        (guards.payment.sol || guards.payment.token || guards.payment.nfts)
          ? guards.payment.sol
            ? "SOL"
            : guards.payment.token
            ? guards.payment.token.mint?.toString() || "Token"
            : guards.payment.nfts
            ? "Nft"
            : ""
          : "",
    };
  }, []);

  const parseGuardGroup = React.useCallback(
    async (
      guardsInput: DefaultCandyGuardSettings,
      candyMachine: CandyMachine,
      walletAddress: PublicKey
    ): Promise<GuardGroup> => {
      const guardsParsed: GuardGroup = {};

      // Check for start date
      if (guardsInput.startDate) {
        const date = new Date(guardsInput.startDate.date.toNumber() * 1000);
        if (date.getTime() > Date.now()) {
          guardsParsed.startTime = date;
        } else {
          guardsParsed.startTime = null;
        }
      }

      // Check for end date
      if (guardsInput.endDate) {
        guardsParsed.endTime = new Date(
          guardsInput.endDate.date.toNumber() * 1000
        );
      }

      // Check for mint limit
      if (guardsInput.mintLimit) {
        guardsParsed.mintLimit = {
          settings: guardsInput.mintLimit,
        };
        if (!guardsParsed.mintLimit.pda)
          guardsParsed.mintLimit.pda = await mx
            .candyMachines()
            .pdas()
            .mintLimitCounter({
              candyGuard: candyMachine.candyGuard.address,
              id: guardsInput.mintLimit.id,
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
      if (guardsInput.redeemedAmount) {
        guardsParsed.redeemLimit =
          guardsInput.redeemedAmount.maximum.toNumber();
      }

      // Check for payment guards

      if (guardsInput.solPayment) {
        guardsParsed.payment = {
          sol: {
            amount: guardsInput.solPayment.amount.basisPoints.toNumber(),
            decimals: guardsInput.solPayment.amount.currency.decimals,
          },
        };
      }

      if (guardsInput.tokenPayment) {
        guardsParsed.payment = {
          token: {
            mint: guardsInput.tokenPayment.tokenMint,
            amount: guardsInput.tokenPayment.amount.basisPoints.toNumber(),
            decimals: guardsInput.tokenPayment.amount.currency.decimals,
          },
        };
      }
      if (guardsInput.nftPayment) {
        guardsParsed.payment = {
          nfts: nftHoldings.filter((y) =>
            y.collection?.address.equals(
              guardsInput.nftPayment.requiredCollection
            )
          ),
        };
      }

      // Check for burn guards

      if (guardsInput.tokenBurn) {
        guardsParsed.burn = {
          token: {
            mint: guardsInput.tokenBurn.mint,
            amount: guardsInput.tokenBurn.amount.basisPoints.toNumber(),
            decimals: guardsInput.tokenBurn.amount.currency.decimals,
          },
        };
      }
      if (guardsInput.nftBurn) {
        guardsParsed.burn = {
          nfts: nftHoldings.filter((y) =>
            y.collection?.address.equals(guardsInput.nftBurn.requiredCollection)
          ),
        };
      }

      // Check for gates

      if (guardsInput.tokenGate) {
        guardsParsed.gate = {
          token: {
            mint: guardsInput.tokenGate.mint,
            amount: guardsInput.tokenGate.amount.basisPoints.toNumber(),
            decimals: guardsInput.tokenGate.amount.currency.decimals,
          },
        };
      }
      if (guardsInput.nftGate) {
        guardsParsed.gate = {
          nfts: nftHoldings.filter((y) =>
            y.collection?.address.equals(guardsInput.nftGate.requiredCollection)
          ),
        };
      }

      // Check for whitelisted addresses

      if (guardsInput.addressGate || guardsInput.allowList) {
        let allowed: PublicKey[] = [];

        if (guardsInput.addressGate)
          allowed.push(guardsInput.addressGate.address);

        try {
          if (!guardsInput.allowList || !candyMachineOpts.whitelistedWallets)
            throw new Error("");

          const index = candyMachineOpts.whitelistedWallets.findIndex((x) =>
            x.equals(walletAddress)
          );
          if (index === -1) throw new Error("");

          const proof = whitelistWalletsTree.getProofArray(index);
          const isValid = whitelistWalletsTree.verifyProof(
            index,
            proof,
            Buffer.from(guardsInput.allowList.merkleRoot)
          );
          if (!isValid) throw new Error("");

          allowed.push(walletAddress);
        } catch {}

        guardsParsed.allowed = allowed;
      }

      if (guardsInput.gatekeeper) {
        guardsParsed.gatekeeperNetwork = guardsInput.gatekeeper.network;
      }

      return {
        ...guards,
        ...guardsParsed,
      };
    },
    [tokenHoldings, nftHoldings, balance, guards, whitelistWalletsTree]
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
        states.isPaymentAvailable = guards.solPayment.amount.basisPoints.lte(
          toBigNumber(balance)
        );
      }

      if (guards.tokenPayment) {
        const tokenAccount = tokenHoldings.find((x) =>
          x.mint.equals(guards.tokenPayment.tokenMint)
        );
        states.isPaymentAvailable =
          !!tokenAccount &&
          guards.tokenPayment.amount.basisPoints.lte(
            toBigNumber(tokenAccount.balance)
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
          guards.tokenBurn.amount.basisPoints.lte(
            toBigNumber(tokenAccount.balance)
          );
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
          guards.tokenGate.amount.basisPoints.lte(
            toBigNumber(tokenAccount.balance)
          );
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

        try {
          if (!guards.allowList || !candyMachineOpts.whitelistedWallets)
            throw new Error("");

          const index = candyMachineOpts.whitelistedWallets.findIndex((x) =>
            x.equals(walletAddress)
          );
          if (index === -1) throw new Error("");

          const proof = whitelistWalletsTree.getProofArray(index);
          const isValid = whitelistWalletsTree.verifyProof(
            index,
            proof,
            Buffer.from(guards.allowList.merkleRoot)
          );
          if (!isValid) throw new Error("");

          allowed.push(walletAddress);
        } catch {}

        // if (
        //   guards.allowList &&
        //   candyMachineOpts.whitelistedWallets &&
        //   !!candyMachineOpts.whitelistedWallets.find((x) =>
        //     x.equals(walletAddress)
        //   )
        // ) {
        //   try {
        //     // mx.candyMachines().callGuardRoute({
        //     //   candyMachine,
        //     //   guard: "allowList",
        //     //   settings: {
        //     //     path: "proof",
        //     //     merkleProof: getMerkleProof(
        //     //       candyMachineOpts.whitelistedWallets.map((x) => x.toBuffer()),
        //     //       walletAddress.toBuffer()
        //     //     ),
        //     //   },
        //     // });
        //     allowed.push(walletAddress);
        //   } catch {}
        // }

        states.isWalletWhitelisted = !!allowed.find((x) =>
          x.equals(walletAddress)
        );
      }

      if (guards.gatekeeper) {
        states.hasGatekeeper = true;
      }

      return {
        ...guardStates,
        ...states,
      };
    },
    [tokenHoldings, nftHoldings, balance, guardStates, whitelistWalletsTree]
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
      if (!candyMachine) return;
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

    setStatus((x) => ({ ...x, candyMachine: true }));
    await fetchCandyMachine()
      .then((cndy) => {
        setCandyMachine(cndy);
        setItems({
          available: cndy.itemsAvailable.toNumber(),
          remaining: cndy.itemsRemaining.toNumber(),
          redeemed: cndy.itemsMinted.toNumber(),
        });

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
      .then((x) =>
        setNftHoldings(x.filter((a) => a.model == "metadata") as any)
      )
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
    refresh().catch((e) =>
      console.error("Error while fetching candy machine", e)
    );
  }, [refresh]);

  React.useEffect(() => {
    if (!candyMachine || !wallet.publicKey) return;

    setStatus((x) => ({ ...x, guardGroups: true }));
    fetchGuardGroups(candyMachine, wallet.publicKey)
      .then((groups) => setGuardGroups(groups))
      .catch((e) => "Error while fetching gaurd groups")
      .finally(() => setStatus((x) => ({ ...x, guardGroups: false })));
  }, [candyMachine, wallet.publicKey, fetchGuardGroups]);

  React.useEffect(() => {
    const walletAddress = wallet.publicKey;
    if (!walletAddress || !candyMachine) return;

    parseGuardStates(
      candyMachine.candyGuard.guards,
      candyMachine,
      walletAddress
    )
      .then((guardStates) => setGuardStates(guardStates))
      .catch((e) => console.error("Error while fetching default guard", e));
  }, [wallet, candyMachine, parseGuardStates]);

  React.useEffect(() => {
    const walletAddress = wallet.publicKey;
    if (!walletAddress || !candyMachine) return;

    parseGuardGroup(candyMachine.candyGuard.guards, candyMachine, walletAddress)
      .then((guards) => setGuards(guards))
      .catch((e) =>
        console.error("Error while fetching default guard states", e)
      );
  }, [wallet, candyMachine, parseGuardGroup]);

  const mint = React.useCallback(
    async (
      quantityString: number = 1,
      opts: {
        groupLabel?: string;
        guards?: Partial<DefaultCandyGuardMintSettings>;
      } = {}
    ) => {
      if (
        opts.groupLabel &&
        !guardGroups.find((x) => x.label == opts.groupLabel)
      )
        throw new Error("Unknown guard group label");

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
              group: opts.groupLabel,
              guards: opts.guards,
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
            mx
              .nfts()
              .findByMint({
                mintAddress: context.mintSigner.publicKey,
                tokenAddress: context.tokenAddress,
              })
              .catch((e) => null)
          )
        );

        if (guards.mintLimit?.mintCounter)
          guards.mintLimit.mintCounter.count += nfts.length;
        // setItems((x) => ({
        //   ...x,
        //   remaining: x.remaining - nfts.length,
        //   redeemed: x.redeemed + nfts.length,
        // }));
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
        console.error(error);
        throw new Error(message);
      } finally {
        setStatus((x) => ({ ...x, minting: false }));
        refresh();
        return nfts.filter((a) => a);
      }
    },
    [candyMachine, guards, guardGroups, mx, refresh]
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
