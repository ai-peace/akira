import { PublicKey } from "@solana/web3.js";

const IDL_PATH = "./target/idl/akira_solana.json";

// プログラムID
const PROGRAM_ID = new PublicKey(
  "CY6qKVgEFq5yztnwq2ycf1hQAmuDnsaH62DCXMYgQJAK"
);

// ネットワーク設定
const NETWORK_URLS = {
  localnet: "http://127.0.0.1:8899",
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
} as const;

// PDA Seeds
const SEEDS = {
  CONFIG: "config",
  COLLECTION_CONFIG: "collection_config",
  PURCHASE_REQUEST: "purchase_request",
  RWA_STATE: "rwa_state",
} as const;

const scriptConsts = {
  PROGRAM_ID,
  NETWORK_URLS,
  SEEDS,
  IDL_PATH,
};

export { scriptConsts };
