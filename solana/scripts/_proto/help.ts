#!/usr/bin/env tsx

console.log(`🚀 Akira Solana RWA Scripts`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

console.log(`\n👨‍💼 Admin Scripts (s:a:*):`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`• s:a:init               - Initialize global config`);
console.log(`• s:a:config             - Get current global config`);
console.log(`• s:a:update             - Update deposit target`);
console.log(`• s:a:init-collection    - Initialize new collection`);
console.log(`• s:a:update-collection  - Update existing collection`);
console.log(
  `• s:a:exchange-nft       - Exchange NFT (freeze on physical asset transfer)`
);
console.log(`• s:a:admin-lock         - Emergency lock NFT (admin only)`);
console.log(`• s:a:update-uri         - Update RWA NFT metadata URI`);

console.log(`\n💰 Deposit Scripts (s:d:*):`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`• s:d:create-purchase-request - Create new purchase request`);
console.log(`• s:d:deposit-funds           - Deposit SOL to purchase request`);
console.log(
  `• s:d:get-request             - Get purchase request details by ID`
);
console.log(`• s:d:check-funded            - Check if request is fully funded`);
console.log(
  `• s:d:find-request            - Find purchase request PDA by owner & ID`
);

console.log(`\n🎨 Mint Scripts (s:m:*):`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`• s:m:mint-rwa   - Mint RWA Collection NFT`);

console.log(`\n🔧 Utility Scripts:`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`• setup          - Initialize global config + collection`);
console.log(`• deploy         - Build and deploy program to devnet`);
console.log(`• test:deploy-cost - Calculate program deployment cost`);
console.log(
  `• test:tx-cost   - Analyze transaction cost (requires tx signature)`
);

console.log(`\n📚 Usage Examples:`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`pnpm run setup`);
console.log(
  `pnpm run s:d:create-purchase-request test-001 "https://metadata.uri" 1.5`
);
console.log(`pnpm run s:d:deposit-funds test-001 2.0`);
console.log(`pnpm run s:m:mint-rwa`);
console.log(`pnpm run s:a:exchange-nft <nft_mint> akira-1122`);

console.log(`\n💡 Tips:`);
console.log(`• Use 'pnpm run <script_name> --help' for specific script help`);
console.log(`• Config files are located in scripts/seed/`);
console.log(`• All scripts support devnet by default`);
console.log(`• Check README.md for detailed documentation`);

console.log(`\n🔗 Resources:`);
console.log(`• Solana Explorer: https://explorer.solana.com/?cluster=devnet`);
console.log(`• Program ID: CY6qKVgEFq5yztnwq2ycf1hQAmuDnsaH62DCXMYgQJAK`);
console.log(`• Documentation: scripts/seed/README.md`);
