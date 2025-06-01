import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import { scriptProperties } from "../consts/scriptProperties";
import { scriptConsts } from "../consts/scriptConsts";

export const factoryProgramMethods = () => {
  const idlPath = scriptConsts.IDL_PATH;
  const idl = factoryIdl(idlPath);
  const wallet = factoryAdminWallet();
  const provider = factoryProvider(wallet);
  const program = factoryProgram(idl, provider);
  const keypair = factoryAdminWalletKeypair();

  return { program, provider, wallet, keypair };
};

export const factoryPda = (seeds: Buffer[], programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
};

export const factoryAdminWallet = () => {
  const walletKeypair = factoryAdminWalletKeypair();
  const wallet = new anchor.Wallet(walletKeypair);
  return wallet;
};

export const factoryAdminWalletKeypair = () => {
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(fs.readFileSync(scriptProperties.walletPath, "utf8"))
    )
  );
  return walletKeypair;
};

export const factoryConnection = () => {
  const connection = new Connection(
    scriptConsts.NETWORK_URLS[scriptProperties.solanaNetwork],
    "confirmed"
  );
  return connection;
};

// private functions

const factoryIdl = (idlPath: string) => {
  return JSON.parse(fs.readFileSync(idlPath, "utf8"));
};

const factoryProvider = (wallet: anchor.Wallet) => {
  const connection = factoryConnection();
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
