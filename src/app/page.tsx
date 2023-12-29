"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import { WalletButton } from "@/components/solana-provider";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

const VAULT_ADDRESS = new PublicKey(
  "FysF4GbhYPRXHyFYTGxaqR8tFqUTFhLgwfG4msTqkm7M"
);

interface Nft {
  mint: string;
  name: string;
  image: string;
}

const Home = () => {
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [selectedNft, setSelectedNft] = useState<string>("");

  const wallet = useWallet();

  useEffect(() => {
    if (wallet.publicKey) {
      fetchCollectionNfts();
    } else {
      setNfts([]);
    }
  }, [wallet.publicKey]);

  const fetchCollectionNfts = async () => {
    const url =
      "https://mainnet.helius-rpc.com/?api-key=d3c0176e-a4b9-4af6-a9de-7d15d757f31d";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "0",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: wallet.publicKey!.toString(),
          // ownerAddress: "9acPYYkQESAgpzbzjeNxNVWeMGDEof4H7qHcMzmHdhZf",
          page: 1,
          limit: 1000,
        },
      }),
    });
    const { result } = await response.json();

    // const collectionAddress = "7FxzXETJZKtQxHSAjwU8dGEUdqxzzM4veGb2mWSGhifi"; // Monki
    const collectionAddress = "WBixyhiaoiRBLAzuciMZND8GVTqhEskWf14enLcahja"; // platypus
    const nftsFiltered: Nft[] = result.items
      .map((item: any) => {
        if (
          item.grouping[0] &&
          item.grouping[0].group_key == "collection" &&
          item.grouping[0].group_value == collectionAddress
        ) {
          return {
            mint: item.id,
            name: item.content?.metadata?.name,
            image: item.content?.links?.image,
          };
        }
      })
      .filter(Boolean);
    setNfts(nftsFiltered);
  };

  const createSolanaTx = async () => {
    // const connection = new Connection("https://api.mainnet-beta.solana.com");
    const connection = new Connection(
      "https://autumn-hardworking-thunder.solana-mainnet.quiknode.pro/c48f123b73c3e0784c1fd0247ccc712177df5c42/"
    );
    const tx = new Transaction();

    const sourceATA = await getAssociatedTokenAddress(
      new PublicKey(selectedNft),
      wallet.publicKey!
    );
    const destinationATA = await getAssociatedTokenAddress(
      new PublicKey(selectedNft),
      VAULT_ADDRESS
    );

    const createDestinationATAIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey!,
      destinationATA,
      VAULT_ADDRESS,
      new PublicKey(selectedNft)
    );
    tx.add(createDestinationATAIx);

    const trasnferNftIx = createTransferCheckedInstruction(
      sourceATA,
      new PublicKey(selectedNft),
      destinationATA,
      wallet.publicKey!,
      1,
      0
    );
    tx.add(trasnferNftIx);

    const closeSourceATAIx = createCloseAccountInstruction(
      sourceATA,
      VAULT_ADDRESS,
      wallet.publicKey!
    );
    tx.add(closeSourceATAIx);

    const signature = await wallet.sendTransaction(tx, connection);
    console.log(signature);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-slate-900 text-white text-lg">
      <div className="px-12 py-6 space-y-4 bg-slate-700 rounded-lg">
        <div className="flex justify-between space-x-8 items-center">
          <p>1. Connect Solana Wallet</p>
          <WalletButton />
        </div>

        <div className="items-center">
          <p
            onClick={() => {
              console.log(nfts);
            }}
          >
            2. Select NFT you want to bridge
          </p>
          <div className="flex justify-center">
            {nfts.length > 0 && (
              <div className="w-fit grid grid-cols-4 place-items-center gap-3 mt-3">
                {nfts.map((nft: Nft) => {
                  return (
                    <Image
                      className="rounded-md hover:cursor-pointer ring-orange-600 hover:ring-4"
                      onClick={(e) => {
                        setSelectedNft(nft.mint);

                        const img = e.currentTarget;
                        if (img.dataset.clicked === "true") {
                          img.dataset.clicked = "false";
                          img.className =
                            "rounded-md hover:cursor-pointer ring-orange-600 hover:ring-4";
                        } else {
                          img.dataset.clicked = "true";
                          img.className =
                            "rounded-md hover:cursor-pointer ring-orange-600 ring-4";
                        }
                      }}
                      src={nft.image}
                      width={96}
                      height={96}
                      alt={nft.name}
                      key={nft.mint}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center space-x-4">
          <p className="whitespace-nowrap inline-block">
            3. Enter your Injective address
          </p>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="inj..."
            required
          />
        </div>

        <div className="flex justify-center mt-6">
          <button
            className="bg-orange-600 px-2 py-1 rounded-md text-xl"
            onClick={createSolanaTx}
          >
            Bridge
          </button>
        </div>
      </div>
    </main>
  );
};

export default Home;
