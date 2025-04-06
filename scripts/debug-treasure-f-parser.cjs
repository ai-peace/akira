const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

// HTMLファイルを読み込む
const htmlFilePath = process.argv[2]
if (!htmlFilePath) {
  console.error('使用方法: node debug-treasure-f-parser.cjs [HTMLファイルパス]')
  process.exit(1)
}

const html = fs.readFileSync(htmlFilePath, 'utf-8')
console.log(`HTMLを読み込みました: ${htmlFilePath} (${html.length} バイト)`)

// 商品情報を抽出する関数
const mapHtmlToProducts = (html) => {
  const $ = cheerio.load(html)
  const products = []

  // 商品リストのセレクタをいくつか試す
  const productSelectors = [
    'ul[ref="s1e191"] > li',
    'ul[ref^="s1e"] > li[ref^="s1e"]',
    '.items > .item',
    '.cm-itemlist.cm-itemlist_a > .pj-search_item',
    'ul.cm-itemlist > li.pj-search_item',
    '.pj-search_items .cm-itemlist li',
  ]

  let $items = []
  for (const selector of productSelectors) {
    const items = $(selector)
    console.log(`セレクタ ${selector} で ${items.length} 個の商品要素が見つかりました`)
    if (items.length > 0) {
      items.each((_, element) => {
        $items.push($(element))
      })
      break
    }
  }

  console.log(`合計 ${$items.length} 個の商品要素が見つかりました`)

  // さらに詳細なデバッグ情報
  if ($items.length === 0) {
    console.log('商品リストが見つかりませんでした。以下のHTMLセクションを確認します:')

    // より広範囲な検索を試みる
    console.log('\n==== 検索コンテンツ部分のDOM構造 ====')
    const searchSection = $('.pj-search_main')
    if (searchSection.length > 0) {
      console.log('検索メインコンテナが見つかりました')

      const itemsSection = searchSection.find('.pj-search_items')
      if (itemsSection.length > 0) {
        console.log('商品リストセクションが見つかりました')
        console.log('商品リスト内のUL要素:', itemsSection.find('ul').length)
        console.log('商品リスト内のLI要素:', itemsSection.find('li').length)

        // 最も単純なセレクタで試す
        const allItems = $('.pj-search_items li')
        console.log(
          `単純なセレクタ .pj-search_items li で ${allItems.length} 個の要素が見つかりました`,
        )

        if (allItems.length > 0) {
          allItems.each((i, el) => {
            if (i < 3) {
              // 最初の3つだけデバッグ表示
              console.log(`\n商品 #${i + 1} の構造:`)
              console.log($(el).html().substring(0, 200) + '...')
            }
          })

          // 改めて商品リストを取得し直す
          $items = []
          allItems.each((_, element) => {
            $items.push($(element))
          })
        }
      } else {
        console.log('商品リストセクションが見つかりませんでした')
      }
    } else {
      console.log('検索メインコンテナが見つかりませんでした')
    }
  }

  // 商品情報の抽出
  for (const $item of $items) {
    try {
      // 商品ページへのリンク
      const itemLink = $item
        .find('a[href*="/item/"], a[href*="/ec/detail/"], a.cm-itemlist_itemcode_link')
        .first()
      const itemHref = itemLink.attr('href')

      if (!itemHref) {
        console.log('商品リンクが見つかりませんでした')
        continue
      }

      // 商品ページのURL
      let url
      if (itemHref.startsWith('http')) {
        url = itemHref
      } else if (itemHref.startsWith('/item/')) {
        url = `https://ec.treasure-f.com${itemHref}`
      } else if (itemHref.includes('/ec/detail/')) {
        url = `https://ec.treasure-f.com${itemHref}`
      } else {
        url = `https://ec.treasure-f.com${itemHref}`
      }

      // 商品タイトル
      let title = ''
      // 商品タイトルの取得（複数の方法でトライ）
      const titleElements = [
        $item.find('.cm-itemlist_text').last(), // 最後のテキスト要素（通常商品名）
        $item.find('.cm-typo_body_a.cm-itemlist_text').last(), // クラス指定でより詳細に
        $item.find('p.cm-itemlist_text').last(), // pタグで指定
        $item
          .find('text')
          .filter(function () {
            return (
              $(this).text().trim().length > 0 &&
              !$(this).text().includes('￥') &&
              !$(this).text().includes('¥')
            )
          })
          .first(),
      ]

      // 最初に見つかった有効なタイトル要素を使用
      for (const elem of titleElements) {
        if (elem.length > 0 && elem.text().trim()) {
          title = elem.text().trim()
          break
        }
      }

      // 通常のHTML形式のバックアップ
      if (!title) {
        title = $item.find('.item_name, .name, .title').first().text().trim()
      }

      if (!title) {
        console.log('商品タイトルが見つかりませんでした')
        continue
      }

      // 価格
      // スナップショット形式と通常のHTML形式の両方の要素を試す
      const priceSelectors = [
        'p.cm-typo_head4.cm-itemlist_price', // 実際のサイトの価格表示要素
        '.cm-itemlist_price',
        'paragraph[ref^="s1e"]',
        '.item_price',
        '.price',
        '.selling_price',
      ]

      let priceText = ''
      for (const selector of priceSelectors) {
        const elem = $item.find(selector).filter(function () {
          const text = $(this).text()
          return text.includes('￥') || text.includes('¥')
        })

        if (elem.length > 0 && elem.text().trim()) {
          priceText = elem.text().trim()
          break
        }
      }

      if (!priceText) {
        console.log('商品価格が見つかりませんでした')
        continue
      }

      // 価格からテキストを抽出して数値化
      const priceMatch = priceText.match(/[¥￥]([0-9,]+)/)
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0

      if (!price) {
        console.log(`価格が正しく抽出できませんでした: ${priceText}`)
        continue
      }

      // 商品画像
      let imageUrl = ''
      // 画像要素を探す（複数の方法でトライ）
      const imageSelectors = [
        '.cm-itemlist_image img', // 実際のサイトの画像要素
        'image[ref^="s1e"]',
        'img.item_image',
        'img.image',
        'img.product_image',
        'img', // 最後の手段として任意のimg要素
      ]

      for (const selector of imageSelectors) {
        const elem = $item.find(selector).first()
        if (elem.length > 0) {
          imageUrl = elem.attr('src') || elem.attr('data-src') || ''
          if (imageUrl) break
        }
      }

      // 相対パスの場合はベースURLを追加
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `https://ec.treasure-f.com${imageUrl}`
      }

      // 商品の状態
      // 様々な状態表示要素を試す
      const conditionSelectors = [
        '.cm-tag_unused',
        '.cm-tag_new',
        'text',
        '.item_condition',
        '.condition',
        '.status',
      ]

      let conditionText = ''
      for (const selector of conditionSelectors) {
        let elem
        if (selector === 'text') {
          elem = $item
            .find(selector)
            .filter(function () {
              const text = $(this).text().trim()
              return text === '未使用' || text.includes('SALE') || text.includes('NEW')
            })
            .first()
        } else {
          elem = $item.find(selector).first()
        }

        if (elem.length > 0 && elem.text().trim()) {
          conditionText = elem.text().trim()
          break
        }
      }

      // 未使用タグがない場合
      if (!conditionText) {
        conditionText = '状態不明'
      }

      // 商品コードの抽出
      const itemCodeMatch = url.match(/\/item\/([^\/\?]+)/) || url.match(/\/ec\/detail\/([^\/\?]+)/)
      const itemCode = itemCodeMatch
        ? itemCodeMatch[1]
        : `tf-${Math.random().toString(36).substring(2, 10)}`

      const product = {
        url,
        title,
        price,
        currency: 'JPY',
        condition: conditionText,
        itemCode,
        imageUrl,
      }

      products.push(product)
    } catch (error) {
      console.error('商品の解析中にエラーが発生しました:', error)
    }
  }

  console.log(`抽出された商品数: ${products.length}`)
  return products
}

// 商品情報を抽出
const products = mapHtmlToProducts(html)

// 結果を表示
if (products.length > 0) {
  console.log('\n==== 抽出された商品情報 ====')
  products.forEach((product, index) => {
    console.log(`\n商品 #${index + 1}:`)
    console.log(`- タイトル: ${product.title}`)
    console.log(`- 価格: ${product.price}円`)
    console.log(`- 状態: ${product.condition}`)
    console.log(`- 商品コード: ${product.itemCode}`)
    console.log(`- URL: ${product.url}`)
    console.log(`- 画像URL: ${product.imageUrl}`)
  })
} else {
  console.log('\n商品情報を抽出できませんでした。')
}
