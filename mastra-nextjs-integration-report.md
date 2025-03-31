# Mastra と Next.js の統合レポート

## 1. 問題の概要

Next.jsプロジェクトでMastraを使用する際に、以下のようなビルドエラーが発生しました：

```
ReferenceError: _BaseFilterTranslator is not defined
```

このエラーは、Next.jsのビルドシステムがMastraの依存関係を適切に解決できないことが原因でした。

## 2. 解決策

### 2.1 next.config.jsの重要な設定

```javascript
{
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@libsql/client', '@mastra/core']
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['punycode', '@mastra/core'],
  }
}
```

### 2.2 設定の詳細説明

#### externalsの設定

```javascript
config.externals = [...(config.externals || []), '@libsql/client', '@mastra/core']
```

- **目的**: 特定のモジュールをNext.jsのバンドルプロセスから除外
- **効果**:
  - Mastraのモジュールは実行時にNode.jsのrequire/importシステムを使用
  - Webpackのバンドル処理をバイパス
  - 複雑な依存関係を本来のNode.jsの方法で解決

#### serverComponentsExternalPackages

```javascript
experimental: {
  serverComponentsExternalPackages: ['punycode', '@mastra/core'],
}
```

- **目的**: Server Componentsでの特定パッケージの処理方法を指定
- **効果**:
  - Mastraのモジュールに対するServer Componentsの最適化をスキップ
  - Node.jsのモジュールシステムを直接使用
  - 依存関係の動的解決を可能に

## 3. なぜこの設定が必要か

### 3.1 Mastraの特徴

- 独自のAIエージェントシステムを実装
- 複雑な依存関係構造
- 動的なモジュール解決メカニズム
- `_BaseFilterTranslator`のような動的に生成/解決されるクラスの存在

### 3.2 Next.jsのビルドプロセス

- 通常は全ての依存関係を静的に解析
- バンドル時に依存関係を最適化
- 動的な依存関係の解決が困難
- Server Componentsによる追加の最適化レイヤー

### 3.3 両者の互換性

- Mastraの動的な性質とNext.jsの静的解析の不一致
- Server Components最適化とMastraの依存関係解決の競合
- Node.jsネイティブのモジュールシステムの必要性

## 4. 実装のベストプラクティス

### 4.1 APIルートの分離

```typescript
// app/api/mastra/[...route]/route.ts
const mastraHono = new Hono().basePath('/api/mastra')
mastraHono.route('/', createChatPromptGroup)
mastraHono.route('/', createChat)
```

- Mastra関連のエンドポイントを専用のルートに分離
- 依存関係の影響範囲を限定
- メンテナンス性の向上

### 4.2 実行時の挙動

- 開発サーバー起動時: Mastraモジュールは通常のNode.jsモジュールとして動作
- API呼び出し時: Node.jsのrequire/importシステムを通じて依存関係を解決
- Server Components: 最適化をバイパスして直接モジュールを使用

## 5. 注意点

1. この設定は`isServer`の場合のみ適用される
2. プロダクションビルドとデベロップメントモードの両方で動作確認が必要
3. Mastraのバージョンアップデート時は設定の再確認が推奨

## 6. 今後の展望

1. Next.jsの将来のバージョンでの互換性維持
2. Mastraの依存関係解決メカニズムの進化への対応
3. Server Componentsの最適化との更なる統合

## 7. 参考リンク

- [Next.js Configuration Documentation](https://nextjs.org/docs/app/api-reference/next-config-js)
- [Mastra Documentation](https://mastra.ai/docs/deployment/server)
- [Server Components Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
