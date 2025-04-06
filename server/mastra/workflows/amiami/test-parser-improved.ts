import fs from 'fs'
import * as cheerio from 'cheerio'
import path from 'path'

// デバッグ用スクリプト
const main = async () => {
  const htmlPath = path.join(process.cwd(), 'debug', 'amiami-test.html')
  console.log('HTMLパス:', htmlPath)

  if (!fs.existsSync(htmlPath)) {
    console.error('ファイルが存在しません:', htmlPath)
    return
  }

  const html = fs.readFileSync(htmlPath, 'utf-8')
  console.log('HTMLファイルサイズ:', html.length)

  const $ = cheerio.load(html)

  // ページタイトルの確認
  console.log('ページタイトル:', $('title').text())

  // 主要なセクションの確認
  console.log('\n主要なセクション:')
  console.log('.product_box:', $('.product_box').length)
  console.log('.product_table_list:', $('.product_table_list').length)
  console.log('.contents_list:', $('.contents_list').length)

  // 実際の商品アイテムを確認
  if ($('.product_box').length > 0) {
    console.log('\n最初の3つの商品情報:')
    $('.product_box')
      .slice(0, 3)
      .each((index, element) => {
        const $item = $(element)
        console.log(`\n--- 商品 ${index + 1} ---`)
        console.log('商品名:', $item.find('.product_name').text().trim())
        console.log('URL:', $item.find('a').attr('href'))
        console.log('価格:', $item.find('.product_price').text().trim())
        console.log('在庫状態:', $item.find('.product_icon').text().trim())
        console.log('画像URL:', $item.find('.product_img img').attr('src'))
      })
  } else {
    // セレクターが機能しない場合、別のアプローチを試みる
    console.log('\n商品箱が見つかりません。HTMLの構造を詳しく確認します:')

    // bodyの直下の主要な要素を確認
    console.log('\nbody直下の主要な要素:')
    $('body > *').each((i, el) => {
      console.log(
        `${i + 1}. <${el.tagName.toLowerCase()}> class="${$(el).attr('class') || 'なし'}" id="${$(el).attr('id') || 'なし'}"`,
      )
    })

    // 商品リストの可能性がある要素を確認
    console.log('\n商品リストの可能性がある要素を検索:')
    const possibleContainers = [
      'table',
      'ul',
      'div.list',
      'div.products',
      'div.items',
      'div.results',
      'div.container',
    ]

    possibleContainers.forEach((selector) => {
      const elements = $(selector)
      console.log(`${selector}: ${elements.length}個`)
      if (elements.length > 0) {
        elements.slice(0, 1).each((_, el) => {
          const $el = $(el)
          console.log(`  - class="${$el.attr('class') || 'なし'}" id="${$el.attr('id') || 'なし'}"`)
          console.log(`  - 子要素: ${$el.children().length}個`)
        })
      }
    })

    // 商品を含む可能性のあるセレクターを試してみる
    console.log('\n商品を含む可能性のあるセレクターを試行:')
    const itemSelectors = ['.item', '.product', 'tr', 'li', '.box', '.grid-item']

    itemSelectors.forEach((selector) => {
      const items = $(selector)
      console.log(`${selector}: ${items.length}個`)
      if (items.length > 0) {
        const sample = items.first()
        console.log(`  サンプル: ${sample.text().substr(0, 50)}...`)
      }
    })

    // 実際の商品データを見つけるための別のアプローチ
    console.log('\n商品名と思われる要素を探索:')
    $('a').each((i, el) => {
      const $a = $(el)
      const href = $a.attr('href') || ''
      // 商品リンクらしきものを探す
      if (href.includes('detail') || href.includes('product') || href.includes('item')) {
        console.log(`${i + 1}. リンク: ${href}`)
        console.log(`   テキスト: ${$a.text().trim().substr(0, 50)}...`)
        console.log(
          `   親要素: <${el.parentNode.tagName.toLowerCase()}> class="${$(el.parentNode).attr('class') || 'なし'}"`,
        )
        console.log('---')

        // 見つかったら、その親構造をさらに調査
        const $parent = $(el.parentNode)
        const $grandparent = $parent.parent()
        console.log(
          `   祖父要素: <${$grandparent.prop('tagName').toLowerCase()}> class="${$grandparent.attr('class') || 'なし'}"`,
        )

        // もし見つかったら5つまで表示して終了
        if (i >= 4) return false
      }
    })
  }
}

main().catch(console.error)
