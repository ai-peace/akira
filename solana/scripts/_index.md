# Solana 固定送付先機能 コマンドチートシート

## 設定関連

### グローバル設定の初期化

```bash
pnpm tsx scripts/01_settings/01_simple-init.ts FXRdPWnZmfGbBxoe3ereZdR1NgUqPzDDaZJ9vt68TbQ3
```

### 現在の設定情報を取得

```bash
pnpm tsx scripts/01_settings/02_get-config.ts
```

### グローバル設定の初期化

```bash
pnpm tsx scripts/01_settings/03_deploy-init.ts FXRdPWnZmfGbBxoe3ereZdR1NgUqPzDDaZJ9vt68TbQ3
```

## 購入リクエスト関連

### 購入リクエストの作成と入金（一括処理）

```bash
pnpm tsx scripts/02_deposit/01_create-and-deposit.ts
```

### 購入リクエスト一覧の取得

```bash
pnpm tsx scripts/02_deposit/02_list-purchase-requests.ts
```

このコマンドで、テーブル形式で一覧を表示（SOL 単位と lamports の両方の金額）

### 購入リクエスト情報の取得

```bash
pnpm tsx scripts/02_deposit/03_get-purchase-info.ts [購入リクエストPDA]
```

例：

```bash
pnpm tsx scripts/02_deposit/03_get-purchase-info.ts 2r5ds3vucQrVC8eycZTxSsQMAJsZVrSFeHf3Efc1wBBn
```

このコマンドで詳細情報を表示（SOL 単位と lamports の両方の金額）

### 購入リクエストの作成

```bash
pnpm tsx scripts/98_others/purchase-client.ts create [リクエストID] [メタデータURI] [価格(lamports)]
```

### リクエストへの入金

```bash
pnpm tsx scripts/98_others/purchase-client.ts deposit [リクエストPDA] [金額(lamports)]
```

### リクエスト情報表示

```bash
pnpm tsx scripts/98_others/purchase-client.ts info [リクエストPDA]
```

### 設定情報表示

```bash
pnpm tsx scripts/98_others/purchase-client.ts get-config
```

### 送付先 PDA の更新

```bash
pnpm tsx scripts/98_others/purchase-client.ts update-target [新しい送付先PDA]
```
