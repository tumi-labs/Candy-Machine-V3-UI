import { Paper, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import {
  CandyMachine,
  Metaplex,
  MintLimitGuardSettings,
  Pda,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  AccountInfo,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import confetti from "canvas-confetti";
import Link from "next/link";
import Countdown from "react-countdown";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { MintCounterBorsh } from "./borsh/mintCounter";
import { GatewayProvider } from "@civic/solana-gateway-react";

import { MintButton } from "./MintButton";
import {
  Heading,
  Hero,
  MintCount,
  NftWrapper,
  NftWrapper2,
  Root,
  StyledContainer,
} from "./styles";
import { AlertState } from "./utils";

const Header = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: right;
  margin: 30px;
  z-index: 999;
  position: relative;

  .wallet-adapter-dropdown-list {
    background: #ffffff;
  }
  .wallet-adapter-dropdown-list-item {
    background: #000000;
  }
  .wallet-adapter-dropdown-list {
    grid-row-gap: 5px;
  }
`;

const WalletAmount = styled.div`
  color: black;
  width: auto;
  padding: 5px 5px 5px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 5px;
  background-color: #85b1e2;
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%),
    0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

const ConnectButton = styled(WalletMultiButton)`
  border-radius: 5px !important;
  padding: 6px 16px;
  background-color: #fff;
  color: #000;
  margin: 0 auto;
`;

const Card = styled(Paper)`
  display: inline-block;
  background-color: var(--countdown-background-color) !important;
  margin: 5px;
  min-width: 40px;
  padding: 24px;
  h1 {
    margin: 0px;
  }
`;

export interface HomeProps {
  candyMachineId: PublicKey;
}
export type Guards = {
  address: PublicKey;
  goLiveDate?: Date;
  mintLimit?: {
    settings: MintLimitGuardSettings;
    pda?: Pda;
    accountInfo?: AccountInfo<Buffer>;
    mintCounter?: MintCounterBorsh; //MintCounter;
  };
};

const Home = (props: HomeProps) => {
  const { connection } = useConnection();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>(null);
  const [balance, setBalance] = useState<number>();
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);
  // Yet To Implement
  // const [isActive, setIsActive] = useState(false); // true when countdown completes or whitelisted
  // const [solanaExplorerLink, setSolanaExplorerLink] = useState<string>("");
  // const [isSoldOut, setIsSoldOut] = useState(false);
  // const [payWithSplToken, setPayWithSplToken] = useState(false);
  // const [price, setPrice] = useState(0);
  // const [priceLabel, setPriceLabel] = useState<string>("SOL");
  // const [whitelistPrice, setWhitelistPrice] = useState(0);
  // const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  // const [isBurnToken, setIsBurnToken] = useState(false);
  // const [endDate, setEndDate] = useState<Date>();
  const [whitelistTokenBalance, setWhitelistTokenBalance] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [isPresale, setIsPresale] = useState(false);
  const [isWLOnly, setIsWLOnly] = useState(false);
  const [guards, setGuards] = useState<Guards>();

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const wallet = useWallet();

  const mx = useMemo(
    () => connection && Metaplex.make(connection),
    [connection]
  );
  useEffect(() => {
    if (!mx || !wallet?.publicKey) return;
    mx.use(walletAdapterIdentity(wallet));
    // mx.rpc().sendAndConfirmTransaction(aa as any,{skipPreflight: true})
  }, [mx, wallet]);
  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const cndy = await mx.candyMachines().findByAddress({
        address: new PublicKey(props.candyMachineId),
      });
      console.log(cndy);
      setCandyMachine(cndy);
      setItemsAvailable(cndy.itemsAvailable.toNumber());
      setItemsRemaining(cndy.itemsRemaining.toNumber());
      setItemsRedeemed(cndy.itemsMinted.toNumber());
    })();
  };

  const renderGoLiveDateCounter = ({ days, hours, minutes, seconds }: any) => {
    return (
      <div>
        <Card elevation={1}>
          <h1>{days}</h1>Days
        </Card>
        <Card elevation={1}>
          <h1>{hours}</h1>
          Hours
        </Card>
        <Card elevation={1}>
          <h1>{minutes}</h1>Mins
        </Card>
        <Card elevation={1}>
          <h1>{seconds}</h1>Secs
        </Card>
      </div>
    );
  };

  function throwConfetti(): void {
    confetti({
      particleCount: 400,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
  function displaySuccess(qty: number = 1): void {
    if (guards.mintLimit?.mintCounter)
      guards.mintLimit.mintCounter.count += qty;
    let remaining = itemsRemaining - qty;
    setItemsRemaining(remaining);
    // setIsSoldOut(remaining === 0);

    setItemsRedeemed(itemsRedeemed + qty);
    connection.getBalance(wallet.publicKey).then((balance) => {
      setBalance(balance / LAMPORTS_PER_SOL);
    });

    throwConfetti();
  }
  const startMint = async (quantityString: number = 1) => {
    try {
      console.log(quantityString, candyMachine);
      if (!candyMachine) return;
      setIsMinting(true);

      for (let index = 0; index < quantityString; index++) {
        console.log(candyMachine.authorityAddress.toString());
        await mx.candyMachines().mint(
          {
            candyMachine,
            // group: "public",
            collectionUpdateAuthority: candyMachine.authorityAddress, // mx.candyMachines().pdas().authority({candyMachine: candyMachine.address})
          },
          {
            // confirmOptions: {
            //   skipPreflight: true,
            // },
            commitment: "processed",
            confirmOptions: {
              commitment: "processed",
            },
          }
        );
      }

      // update front-end amounts
      displaySuccess(quantityString);
    } catch (error: any) {
      console.error(error);
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

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      // refreshCandyMachineState();

      setIsMinting(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        console.log(wallet.publicKey.toString());
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, connection]);
  useEffect(() => {
    (async () => {
      if (!candyMachine) return;
      if (candyMachine?.candyGuard?.address) {
        const guardsLocal: Guards = {
          address: candyMachine?.candyGuard.address,
        };
        if (candyMachine.candyGuard.guards.mintLimit) {
          guardsLocal.mintLimit = {
            settings: candyMachine.candyGuard.guards.mintLimit,
          };
          if (wallet?.publicKey && !guardsLocal.mintLimit.pda)
            guardsLocal.mintLimit.pda = await mx
              .candyMachines()
              .pdas()
              .mintLimitCounter({
                candyGuard: candyMachine?.candyGuard.address,
                id: candyMachine.candyGuard.guards.mintLimit.id,
                candyMachine: candyMachine.address,
                user: wallet.publicKey,
              });
          if (guardsLocal.mintLimit.pda) {
            guardsLocal.mintLimit.accountInfo = await connection.getAccountInfo(
              guardsLocal.mintLimit.pda
            );
            if (guardsLocal.mintLimit.accountInfo)
              // [guardsLocal.mintLimit.mintCounter] = MintCounter.fromAccountInfo(
              //   guardsLocal.mintLimit.accountInfo
              // );
              guardsLocal.mintLimit.mintCounter = MintCounterBorsh.fromBuffer(
                guardsLocal.mintLimit.accountInfo.data
              );
          }
        }
        if (candyMachine?.candyGuard?.guards?.startDate) {
          const date = new Date(
            candyMachine?.candyGuard?.guards.startDate.date.toNumber() * 1000
          );
          if (date.getTime() > Date.now()) {
            guardsLocal.goLiveDate = date;
          } else {
            guardsLocal.goLiveDate = null;
          }
        }
        setGuards(guardsLocal);
      }
    })();
  }, [wallet, candyMachine, balance, connection]);
  useEffect(() => {
    console.log({ guards });
  }, [guards]);
  useEffect(refreshCandyMachineState, [
    wallet,
    props.candyMachineId,
    connection,
    isEnded,
    isPresale,
  ]);

  const gatekeeperNetwork = candyMachine?.candyGuard?.guards?.gatekeeper?.network;
  return (
    <main>
      <>
        <Header>
          {/* <Link href='/'>
            <img
              style={{
                filter: 'invert(1)',
                maxWidth: '200px',
                marginLeft: 30,
                marginTop: 10,
              }}
              src='/logo.png'
              alt='logo'
            />
          </Link> */}
          <WalletContainer>
            <Wallet>
              {wallet ? (
                <WalletAmount>
                  {(balance || 0).toLocaleString()} SOL
                  <ConnectButton />
                </WalletAmount>
              ) : (
                <ConnectButton>Connect Wallet</ConnectButton>
              )}
            </Wallet>
          </WalletContainer>
        </Header>
        <Root>
          <div className="cloud-content">
            {[...Array(7)].map((cloud, index) => (
              <div key={index} className={`cloud-${index + 1} cloud-block`}>
                <div className="cloud"></div>
              </div>
            ))}
          </div>
          <StyledContainer>
            {/* <MintNavigation /> */}

            <Hero>
              <Heading>
                <Link href="/">
                  <img
                    style={{
                      filter: "invert(1)",
                      maxWidth: "350px",
                    }}
                    src="/logo.png"
                    alt="logo"
                  />
                </Link>
              </Heading>

              <p>
                6942 Rejected f00kers here to f00k shit up. 3 mints max per
                wallet. Free. f00k f00k Mother f00kers.
              </p>

              {!guards?.goLiveDate && (
                <MintCount>
                  Total Minted : {itemsRedeemed}/{itemsAvailable}{" "}
                  {guards?.mintLimit?.mintCounter?.count && (
                    <>
                      ({guards?.mintLimit?.mintCounter?.count}
                      {guards?.mintLimit?.settings?.limit && (
                        <>/{guards?.mintLimit?.settings?.limit} </>
                      )}
                      by you)
                    </>
                  )}
                </MintCount>
              )}

              {guards?.goLiveDate ? (
                <Countdown
                  date={guards?.goLiveDate}
                  renderer={renderGoLiveDateCounter}
                  onComplete={() => {
                    refreshCandyMachineState()
                  }}
                />
              ) : !wallet?.publicKey ? (
                <ConnectButton>Connect Wallet</ConnectButton>
              ) : !isWLOnly || whitelistTokenBalance > 0 ? (
                <>

              <div>
                {!!itemsRemaining &&
                candyMachine?.candyGuard?.guards.gatekeeper &&
                wallet.publicKey &&
                wallet.signTransaction ? (
                  <GatewayProvider
                    wallet={{
                      publicKey:
                        wallet.publicKey,
                      //@ts-ignore
                      signTransaction: wallet.signTransaction,
                    }}
                    gatekeeperNetwork={gatekeeperNetwork}
                    clusterUrl={connection.rpcEndpoint}
                    cluster={process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}
                    options={{ autoShowModal: false }}
                    stage="dev"
                  >
                    <MintButton
                    candyMachine={candyMachine}
                    gatekeeperNetwork={gatekeeperNetwork}
                    isMinting={isMinting}
                    setIsMinting={setIsMinting}
                    isActive={!!itemsRemaining}
                    isEnded={isEnded}
                    isSoldOut={!itemsRemaining}
                    limitReached={
                      !!(
                        guards?.mintLimit?.settings?.limit &&
                        !(
                          (guards?.mintLimit?.mintCounter?.count || 0) <
                          guards?.mintLimit?.settings?.limit
                        )
                      )
                    }
                    onMint={startMint}
                    // price={0}
                  />
                  </GatewayProvider>
                ) : (
                  <MintButton
                    candyMachine={candyMachine}
                    isMinting={isMinting}
                    setIsMinting={setIsMinting}
                    isActive={!!itemsRemaining}
                    isEnded={isEnded}
                    isSoldOut={!itemsRemaining}
                    limitReached={
                      !!(
                        guards?.mintLimit?.settings?.limit &&
                        !(
                          (guards?.mintLimit?.mintCounter?.count || 0) <
                          guards?.mintLimit?.settings?.limit
                        )
                      )
                    }
                    onMint={startMint}
                    // price={0}
                  />
                )}
              </div>
                </>
              ) : (
                <h1>Mint is private.</h1>
              )}
            </Hero>
          </StyledContainer>
          <NftWrapper>
            <div className="marquee-wrapper">
              <div className="marquee">
                {[...Array(21)].map((item, index) => (
                  <img
                    key={index}
                    src={`/nfts/${index + 1}.jpeg`}
                    height="200px"
                    width="200px"
                    alt=""
                  />
                ))}
              </div>
            </div>
          </NftWrapper>
          <NftWrapper2>
            <div className="marquee-wrapper second">
              <div className="marquee">
                {[...Array(21)].map((item, index) => (
                  <img
                    key={index}
                    src={`/nfts/${index + 1}.jpeg`}
                    height="200px"
                    width="200px"
                    alt=""
                  />
                ))}
              </div>
            </div>
          </NftWrapper2>
        </Root>
      </>
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default Home;
