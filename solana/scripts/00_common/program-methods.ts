import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import fs from "fs";

type Variables = {
  providerWallet: anchor.Wallet;
  rpcUrl?: string;
  idlPath?: string;
};

export const factoryProgramMethods = ({
  providerWallet,
  rpcUrl = "http://127.0.0.1:8899",
  idlPath = "../../../target/idl/akira_solana.json",
}: Variables) => {
  const idl = factoryIdl(idlPath);
  const provider = factoryProvider(rpcUrl, providerWallet);
  const program = factoryProgram(idl, provider);

  return { program, provider };
};

export const factoryPda = (seeds: Buffer[], programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
};

export const factoryWallet = (keypair: anchor.web3.Keypair) => {
  const wallet = new anchor.Wallet(keypair);
  return wallet;
};

export const factoryKeypairFromLocal = (localKeypairPath: string) => {
  const keypairData = JSON.parse(fs.readFileSync(localKeypairPath, "utf8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  return keypair;
};

export const factoryConnection = (rpcUrl: string) => {
  const connection = new Connection(rpcUrl, "confirmed");
  return connection;
};

// private functions

const factoryIdl = (idlPath: string) => {
  return JSON.parse(fs.readFileSync(idlPath, "utf8"));
};

const factoryProvider = (rpcUrl: string, wallet: anchor.Wallet) => {
  const connection = factoryConnection(rpcUrl);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    skipPreflight: false,
  });

  return provider;
};

const factoryProgram = (idl: any, provider: anchor.AnchorProvider) => {
  const program = new anchor.Program(idl, provider);
  return program;
};
