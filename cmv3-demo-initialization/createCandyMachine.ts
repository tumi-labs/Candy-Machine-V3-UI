import {
  Metaplex,
  PublicKey,
  toBigNumber,
  keypairIdentity,
  sol,
  toDateTime,
  getMerkleRoot,
  token,
  CandyGuardsSettings,
} from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import { writeFileSync } from "fs";

(async function () {
  const cache = require("./cache.json");
  // if (cache.program)
  //   return console.log("Program already found in your cache, exiting...");

  const allowList = require("./allowlist.json");
  const demoNftCollection = new PublicKey(
    "E6wB6MiEiqN4nyTFkmHo2W8EczSbq5ZQSDnQT5RiTYoU"
  );
  const demoTokenMint = new PublicKey(
    "DYMs37sUJz65KmYa31Wzj2TKcTe5M5rhvdkKgcKWiEAs"
  );
  const demoDestination = new PublicKey(
    "CM1h4zABFNvZs5vt3SiNghHBjaf2cVbZAR6pZzXZNUT7"
  );

  const key = Keypair.fromSecretKey(Uint8Array.from(require("C:/Users/kroni/.config/solana/id.json")));
  const { number, creators, ...config } = require("./config.json");

  const metaplex = Metaplex.make(new Connection(clusterApiUrl("devnet"))).use(
    keypairIdentity(key)
  );
  config.creators = creators.forEach((c) => {
    c.address = new PublicKey(c.address);
  });
  const collectionMint = cache.program?.collectionMint
    ? new PublicKey(cache.program?.collectionMint)
    : (
        await metaplex.nfts().create({
          name: "Real Zombies",
          uri: "collection.json",
          creators: config.creators,
          sellerFeeBasisPoints: 0,
          isCollection: true,
          updateAuthority: key,
        })
      ).nft.address;
  const createOrUpdateCandyMachine = async (
    config: CandyGuardsSettings & any,
    {
      candyMachine,
      candyGuard,
    }: { candyMachine?: string; candyGuard?: string } = {}
  ): Promise<{ candyMachine: PublicKey; candyGuard?: PublicKey }> => {
    if (candyMachine) {
      // await metaplex.candyMachines().update({
      //   candyMachine: new PublicKey(candyMachine),
      //   ...config,
      // });
      if (candyGuard) {
        await metaplex.candyMachines().updateCandyGuard({
          candyGuard: new PublicKey(candyGuard),
          ...config,
        });
      }
      return {
        candyMachine: new PublicKey(candyMachine),
        candyGuard: candyGuard && new PublicKey(candyGuard),
      };
    } else {
      return metaplex
        .candyMachines()
        .create(config)
        .then(({ candyMachine }) => ({
          candyMachine: candyMachine.address,
          candyGuard: candyMachine.candyGuard?.address,
        }));
    }
  };
  // Create the Candy Machine.
  const { candyMachine, candyGuard } = await createOrUpdateCandyMachine(
    {
      ...config,
      itemsAvailable: toBigNumber(number),
      collection: {
        address: collectionMint,
        updateAuthority: key,
      },
      guards: {
        botTax: {
          lamports: sol(0.005),
          lastInstruction: true,
        },
      },
      groups: [

        

        {
          label: "WL", // Whitelist (Allowlist)
          guards: {
                startDate: {
                  date: toDateTime("2022-11-12 13:00:00 +1000"),
                },

                endDate: {
                  date: toDateTime("2022-11-12 13:59:00 +1000"),
                },
                
                solPayment: {
                  amount: sol(0.29),
                  destination: demoDestination,
                },
  
  
                mintLimit : {
                  id: 1,
                  limit: 3
              },

                allowList: {
                  merkleRoot: getMerkleRoot(allowList),
            }
          },
        },
       


        {
          label: "Apollo", // Premium (Sol Payment)
          guards: {

            solPayment: {
              amount: sol(0.39),
              destination: demoDestination,
            },

            startDate: {
              date: toDateTime("2022-11-12 14:00:00 +1000"),
                       },



            endDate: {
                date: toDateTime("2022-11-12 14:59:00 +1000"),
                      },

            nftGate : {
              requiredCollection: demoNftCollection
                      },

            mintLimit : {
              id: 2,
              limit: 3
                        }
          },
        },

        

        {
          label: "Public", // Public (Mint Limit[1], Redeemed Amount[50])
          guards: {

            mintLimit: {
              id: 3,
              limit: 33,
            },

            startDate: {
              date: toDateTime('2022-11-12 15:00:00 +1000'),
            },
              
          solPayment: {
            amount: sol(0.59),
            destination: demoDestination,
          }

          },
        },


      /*  {
          label: "tknBrn", // Token Burn
          guards: {
            tokenBurn: {
              amount: token(1, 9),
              mint: demoTokenMint,
            },
          },
        },
        {
          label: "tknGte", // Token Gate
          guards: {
            tokenGate: {
              amount: token(1, 9),
              mint: demoTokenMint,
            },
          },
        },
        {
          label: "tknPmt", // Token Payment
          guards: {
            tokenPayment: {
              amount: token(1, 9),
              mint: demoTokenMint,
              destinationAta: metaplex.tokens().pdas().associatedTokenAccount({
                mint: demoTokenMint,
                owner: demoDestination,
              }),
            },
          },
        },*/


      ],
    },
    cache.program || {}
  );
  cache.program = {
    candyMachine: candyMachine.toString(),
    candyGuard: candyGuard.toString(),
    candyMachineCreator: key.publicKey.toString(),
    collectionMint: collectionMint.toString(),
  };
  writeFileSync("./cache.json", JSON.stringify(cache, null, 2));
})();
