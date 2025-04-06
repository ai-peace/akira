# pageCrawlerのparserを修正してください

## 依頼内容

ありがとうございます。
ページにアクセスすることはできましたが、parserが適正にワークしておらず、商品がないと判断されます。
browser-tool-mcpを使うなどして、parser処理を見直してもらえますか。

## 修正対象

- `server/mastra/workflows/{サイト名}/page-crawler.{サイト名}.step.ts`
- `mapHtmlToProducts` がうまく動作していないようです

## How

- 作成いただいたpageCrawlerを参考に、検索対象URLを取得
- `browser-tool-mcp` を用いてアクセス
- ワンピース、ドラえもん、ドラゴンボールなどのメジャーキーワードで検索
- それを元に取得したHTMLでパースできるかを再現。複数のキーワードで検証する。
- 修正点をpage-crawlerに反映する
