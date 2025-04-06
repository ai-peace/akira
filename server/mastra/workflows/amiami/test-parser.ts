import fs from 'fs'
import * as cheerio from 'cheerio'
import { ProductEntity } from '@/common/domains/entities/product.entity'
import { STOCK_STATUS, type StockStatus } from '@/common/domains/types/stock-status'
import { generateUniqueKey } from '@/server/server-lib/uuid'

// HTMLをProductEntityに変換する関数
const mapHtmlToProducts = (html: string): ProductEntity[] => {
  const $ = cheerio.load(html)
  const products: ProductEntity[] = []

  console.log('HTMLを分析中...')
  // 全体的なHTML構造を確認（デバッグ用）
  console.log('検索結果セクション: ', $('.search_result').length)
  console.log('全アイテムボックス: ', $('.item_box').length)
  console.log('商品セクション: ', $('.search_result .item_box').length)

  // 商品リストの各アイテムを処理
  $('.search_result .item_box').each((index, element) => {
    try {
      const $item = $(element)
      console.log(`アイテム ${index + 1} 処理中...`)

      // タイトルと商品URL
      const $titleLink = $item.find('.product_name a')
      const jaTitle = $titleLink.text().trim()
      const url = $titleLink.attr('href') || ''
      const fullUrl = url.startsWith('http') ? url : `https://www.amiami.jp${url}`

      console.log('タイトル: ', jaTitle)
      console.log('URL: ', fullUrl)

      // 価格情報の取得
      const priceText = $item.find('.price').text().trim()
      console.log('価格テキスト: ', priceText)
      let price = 0
      let priceWithTax = 0

      // 通常価格のパース（¥X,XXX形式）
      const normalPriceMatch = priceText.match(/[￥¥]([\d,]+)/)
      if (normalPriceMatch) {
        price = parseInt(normalPriceMatch[1].replace(/[,]/g, ''))
        priceWithTax = price // AmiAmiはデフォルトで税込表示
        console.log('解析された価格: ', price)
      }

      // 商品画像URL
      const imageUrl = $item.find('.item_img img').attr('src') || ''
      const fullImageUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `https://www.amiami.jp${imageUrl}`
      console.log('画像URL: ', fullImageUrl)

      // 在庫状態のテキスト
      const statusText = $item.find('.item_stock').text().trim() || ''
      console.log('在庫状態テキスト: ', statusText)

      // 在庫状態をStockStatusに変換
      let status: StockStatus = STOCK_STATUS.UNKNOWN
      if (statusText.includes('在庫あり') || statusText.includes('新品')) {
        status = STOCK_STATUS.AVAILABLE
      } else if (statusText.includes('品切れ') || statusText.includes('売り切れ')) {
        status = STOCK_STATUS.OUT_OF_STOCK
      } else if (statusText.includes('予約')) {
        status = STOCK_STATUS.PRE_ORDER
      } else if (statusText.includes('受注') || statusText.includes('取り寄せ')) {
        status = STOCK_STATUS.REQUIRES_USER_CONFIRMATION
      } else if (statusText.includes('中古')) {
        status = STOCK_STATUS.AVAILABLE
      }
      console.log('在庫状態: ', status)

      // 商品の状態（コンディション）
      const condition = statusText.includes('中古') ? '中古' : '新品'
      console.log('商品コンディション: ', condition)

      // 商品コード
      let itemCode = ''
      const itemCodeMatch = url.match(/\/detail\/([\w-]+)/) || url.match(/\/(\w+)\.html/)
      if (itemCodeMatch) {
        itemCode = itemCodeMatch[1]
      } else {
        // URLから取得できない場合は一意のIDを生成
        itemCode = url.split('/').pop()?.split('.')[0] || generateUniqueKey().substring(0, 10)
      }
      console.log('商品コード: ', itemCode)

      // 商品説明（メーカー名など）
      const description = $item.find('.main_maker_name').text().trim()
      console.log('説明: ', description)

      if (!jaTitle || !price) {
        console.log('Skipping item due to missing required fields:', { jaTitle, price })
        return
      }

      const product = {
        uniqueKey: generateUniqueKey(),
        title: {
          ja: jaTitle,
          en: jaTitle, // 英語タイトルは現時点では日本語と同じ
        },
        price,
        priceWithTax,
        currency: 'JPY',
        condition,
        description,
        url: fullUrl,
        imageUrl: fullImageUrl,
        status,
        itemCode,
        shopName: 'amiami',
        shopIconUrl: 'https://www.amiami.jp/images/favicon.png',
      }

      products.push(product)
      console.log('製品をリストに追加: ', product.title.ja)
      console.log('-------------------------')
    } catch (itemError) {
      console.error('Error parsing item data:', itemError)
    }
  })

  return products
}

// デバッグ用に実行
const main = async () => {
  const html = fs.readFileSync('./debug/amiami-test.html', 'utf-8')
  console.log('HTMLファイルサイズ: ', html.length)
  const products = mapHtmlToProducts(html)
  console.log(`解析された商品数: ${products.length}`)

  if (products.length > 0) {
    fs.writeFileSync('./debug/amiami-products.json', JSON.stringify(products, null, 2))
    console.log('商品情報をJSONファイルに保存しました')
  } else {
    console.log('HTMLの解析に問題があります。セレクターを修正してください。')

    // HTML構造を詳細に分析
    const $ = cheerio.load(html)
    console.log('検索結果セクションのclassをチェック:')
    $('body > div').each((i, el) => {
      console.log(`div ${i}: class="${$(el).attr('class')}" id="${$(el).attr('id')}"`)
    })

    // 商品リストの可能性のあるセレクターを試す
    console.log('\n商品リストの可能性のあるセレクター:')
    const selectors = [
      '.searchBox',
      '.searchList',
      '.itemList',
      '.items',
      '.productList',
      '.list_img_table',
      '.list_img_box',
      '#itemList',
      '#searchResult',
    ]

    selectors.forEach((selector) => {
      console.log(`${selector}: ${$(selector).length}件`)
    })

    // 実際の商品アイテムを見つけるための試行
    console.log('\n商品アイテムの可能性のあるセレクター:')
    const itemSelectors = [
      '.item',
      '.product',
      '.product_item',
      '.list_item',
      '.itemBlock',
      '.productBlock',
    ]

    itemSelectors.forEach((selector) => {
      console.log(`${selector}: ${$(selector).length}件`)
    })
  }
}

main().catch(console.error)
