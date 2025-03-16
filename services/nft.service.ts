import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'
import { ProductEntity } from '@/domains/entities/product.entity'

// サーバーサイドで実行する関数
export async function mintNFT(
  connection: Connection,
  userWallet: PublicKey,
  adminKeypair: Uint8Array, // 管理者の秘密鍵（サーバーサイドのみ）
  product: ProductEntity,
) {
  try {
    // 管理者のKeypairを作成
    const keypair = Keypair.fromSecretKey(adminKeypair)

    // Metaplexインスタンスを初期化
    const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair))

    // NFTメタデータを作成
    const { uri } = await metaplex.nfts().uploadMetadata({
      name: product.title.en,
      description: product.description || `RWA NFT for ${product.title.en}`,
      image: product.imageUrl,
      attributes: [
        { trait_type: 'Shop', value: product.shopName },
        { trait_type: 'Price', value: product.price.toString() },
        { trait_type: 'Currency', value: product.currency },
        { trait_type: 'Item Code', value: product.itemCode },
        { trait_type: 'Status', value: product.status },
      ],
      properties: {
        files: [{ uri: product.imageUrl, type: 'image/jpeg' }],
      },
    })

    // NFTを発行
    const { nft } = await metaplex.nfts().create({
      uri,
      name: product.title.en,
      sellerFeeBasisPoints: 500, // 5% royalty
      creators: [{ address: keypair.publicKey, share: 100 }],
    })

    // NFTを送信
    await metaplex.nfts().transfer({
      nftOrSft: nft,
      authority: keypair,
      toOwner: userWallet,
    })

    return {
      success: true,
      mintAddress: nft.address.toString(),
      metadata: uri,
    }
  } catch (error: any) {
    console.error('NFT発行エラー:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
