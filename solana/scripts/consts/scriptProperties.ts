import * as dotenv from "dotenv";
dotenv.config();

const scriptProperties = {
  solanaNetwork: process.env.SOLANA_NETWORK!,
  walletPath: process.env.WALLET_PATH || "~/.config/solana/id.json",
};

export { scriptProperties };
