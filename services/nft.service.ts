import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { Metaplex, keypairIdentity, CreateNftInput } from '@metaplex-foundation/js'
import { ProductEntity } from '@/domains/entities/product.entity'

type MintNFTResult = {
  success: boolean
  mintAddress: string
  metadata: string
  error?: string
}

// 文字列を最大バイト数で切り詰める関数
const truncateStringByBytes = (str: string, maxBytes: number): string => {
  if (!str) return ''
  const encoder = new TextEncoder()
  let encoded = encoder.encode(str)
  if (encoded.length <= maxBytes) return str

  // バイト数がmaxBytesを超えていたら末尾から削っていく
  let truncated = str
  while (encoder.encode(truncated).length > maxBytes) {
    truncated = truncated.slice(0, -1)
  }
  return truncated
}

// サーバーサイドで実行する関数
export async function mintNFT(
  connection: Connection,
  walletAddress: PublicKey,
  adminKeypair: Uint8Array, // 管理者の秘密鍵（サーバーサイドのみ）
  product: ProductEntity,
  promptGroupUniqueKey?: string, // プロンプトグループのuniqueKey
): Promise<MintNFTResult> {
  try {
    console.log('デモモード: NFTミント処理を開始します')
    console.log(`ウォレットアドレス: ${walletAddress.toString()}`)
    console.log(`商品ID: ${product.uniqueKey}`)
    if (promptGroupUniqueKey) {
      console.log(`プロンプトグループID: ${promptGroupUniqueKey}`)
    }

    // 管理者のKeypairを作成
    const keypair = Keypair.fromSecretKey(adminKeypair)

    // Metaplexインスタンスを初期化
    const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair))

    console.log('オンチェーンメタデータを使用してNFTを発行します')

    // デフォルトの画像URL
    const defaultImageUrl = 'https://placehold.co/600x400?text=RWA+NFT'
    const imageUrl = product.imageUrl || defaultImageUrl

    // 名前を32バイトに制限（Solanaの制限は32バイト単位）
    const nftName = truncateStringByBytes(product.title.en, 32)
    console.log(`元の商品名: ${product.title.en}, 切り詰め後: ${nftName}`)

    // NFTを発行（オンチェーンメタデータを使用）
    const nftInput: CreateNftInput = {
      name: nftName,
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

    // 説明文も制限
    const description = truncateStringByBytes(
      product.description || `RWA NFT for ${product.title.en}`,
      200,
    )

    // 属性値も制限
    const truncatedShopName = truncateStringByBytes(product.shopName, 50)
    const truncatedItemCode = truncateStringByBytes(product.itemCode, 50)
    const truncatedStatus = truncateStringByBytes(product.status, 50)
    const truncatedPromptGroup = promptGroupUniqueKey
      ? truncateStringByBytes(promptGroupUniqueKey, 50)
      : null

    // メタデータ情報を作成（JSONとして）
    const metadata = JSON.stringify({
      name: nftName,
      description: description,
      image: imageUrl,
      attributes: [
        { trait_type: 'Shop', value: truncatedShopName },
        { trait_type: 'Price', value: product.price.toString() },
        { trait_type: 'Currency', value: product.currency },
        { trait_type: 'Item Code', value: truncatedItemCode },
        { trait_type: 'Status', value: truncatedStatus },
        ...(truncatedPromptGroup
          ? [{ trait_type: 'Prompt Group', value: truncatedPromptGroup }]
          : []),
      ],
      // プロンプトグループ情報を追加
      promptGroup: truncatedPromptGroup || null,
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
