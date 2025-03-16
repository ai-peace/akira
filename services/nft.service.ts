import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { Metaplex, keypairIdentity, CreateNftInput } from '@metaplex-foundation/js'
import { ProductEntity } from '@/domains/entities/product.entity'

type MintNFTResult = {
  success: boolean
  mintAddress: string
  metadata: string
  error?: string
}

// サーバーサイドで実行する関数
export async function mintNFT(
  connection: Connection,
  walletAddress: PublicKey,
  adminKeypair: Uint8Array, // 管理者の秘密鍵（サーバーサイドのみ）
  product: ProductEntity,
): Promise<MintNFTResult> {
  try {
    console.log('デモモード: NFTミント処理を開始します')
    console.log(`ウォレットアドレス: ${walletAddress.toString()}`)
    console.log(`商品ID: ${product.uniqueKey}`)

    // 管理者のKeypairを作成
    const keypair = Keypair.fromSecretKey(adminKeypair)

    // Metaplexインスタンスを初期化
    const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair))

    console.log('オンチェーンメタデータを使用してNFTを発行します')

    // デフォルトの画像URL
    const defaultImageUrl = 'https://placehold.co/600x400?text=RWA+NFT'
    const imageUrl = product.imageUrl || defaultImageUrl

    // NFTを発行（オンチェーンメタデータを使用）
    const nftInput: CreateNftInput = {
      name: product.title.en,
      symbol: 'RWA',
      uri: imageUrl, // 画像URLを直接使用
      sellerFeeBasisPoints: 500, // 5% royalty
      creators: [{ address: keypair.publicKey, share: 100 }],
      isMutable: true,
    }

    console.log('NFT作成パラメータ:', JSON.stringify(nftInput, null, 2))

    // NFTを発行
    const { nft } = await metaplex.nfts().create(nftInput)

    console.log(`NFT発行成功: ${nft.address.toString()}`)

    // NFTを送信
    console.log(`NFTを${walletAddress.toString()}に転送します`)
    await metaplex.nfts().transfer({
      nftOrSft: nft,
      authority: keypair,
      toOwner: walletAddress,
    })

    console.log(`デモモード: NFTミント成功 - ${nft.address.toString()}`)

    // メタデータ情報を作成（JSONとして）
    const metadata = JSON.stringify({
      name: product.title.en,
      description: product.description || `RWA NFT for ${product.title.en}`,
      image: imageUrl,
      attributes: [
        { trait_type: 'Shop', value: product.shopName },
        { trait_type: 'Price', value: product.price.toString() },
        { trait_type: 'Currency', value: product.currency },
        { trait_type: 'Item Code', value: product.itemCode },
        { trait_type: 'Status', value: product.status },
      ],
    })

    return {
      success: true,
      mintAddress: nft.address.toString(),
      metadata: metadata,
    }
  } catch (error: any) {
    console.error('NFT発行エラー:', error)
    return {
      success: false,
      mintAddress: '',
      metadata: '',
      error: error.message || '不明なエラー',
    }
  }
}
