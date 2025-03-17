import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { Metaplex, keypairIdentity, CreateNftInput } from '@metaplex-foundation/js'
import { ProductEntity } from '@/domains/entities/product.entity'

type MintNFTResult = {
  success: boolean
  mintAddress: string
  metadata: string
  error?: string
}

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
  adminKeypair: Uint8Array,
  product: ProductEntity,
  promptGroupUniqueKey?: string,
): Promise<MintNFTResult> {
  try {
    console.log('デモモード: NFTミント処理を開始します')
    console.log(`ウォレットアドレス: ${walletAddress.toString()}`)
    console.log(`商品ID: ${product.uniqueKey}`)
    if (promptGroupUniqueKey) {
      console.log(`プロンプトグループID: ${promptGroupUniqueKey}`)
    }

    const keypair = Keypair.fromSecretKey(adminKeypair)

    const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair))

    console.log('オンチェーンメタデータを使用してNFTを発行')

    // デフォルトの画像URL
    const defaultImageUrl = 'https://placehold.co/600x400?text=RWA+NFT'
    const imageUrl = product.imageUrl || defaultImageUrl

    const nftName = truncateStringByBytes(product.title.en, 32)
    console.log(`元の商品名: ${product.title.en}, 切り詰め後: ${nftName}`)

    const nftInput: CreateNftInput = {
      name: nftName,
      symbol: 'RWA',
      uri: imageUrl,
      sellerFeeBasisPoints: 500,
      creators: [{ address: keypair.publicKey, share: 100 }],
      isMutable: true,
    }

    console.log('NFT作成パラメータ:', JSON.stringify(nftInput, null, 2))
    console.log('Creating NFT with parameters:', nftInput)

    // NFTを発行
    const { nft, response } = await metaplex.nfts().create(
      {
        ...nftInput,
        tokenOwner: walletAddress,
      },
      {
        commitment: 'confirmed',
      },
    )

    await connection.confirmTransaction(response.signature, 'confirmed')

    console.log('NFT created with mint:', nft.address.toString())
    console.log('Transaction signature:', response.signature)

    const description = truncateStringByBytes(
      product.description || `RWA NFT for ${product.title.en}`,
      200,
    )

    const truncatedShopName = truncateStringByBytes(product.shopName, 50)
    const truncatedItemCode = truncateStringByBytes(product.itemCode, 50)
    const truncatedStatus = truncateStringByBytes(product.status, 50)
    const truncatedPromptGroup = promptGroupUniqueKey
      ? truncateStringByBytes(promptGroupUniqueKey, 50)
      : null

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
      promptGroup: truncatedPromptGroup || null,
    })

    return {
      success: true,
      mintAddress: nft.address.toString(),
      metadata: metadata,
    }
  } catch (error: any) {
    console.error('Detailed error:', error)
    if (error.logs) {
      console.error('Transaction logs:', error.logs)
    }
    return {
      success: false,
      mintAddress: '',
      metadata: '',
      error: error.message || '不明なエラー',
    }
  }
}
