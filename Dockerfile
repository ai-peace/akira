# Alpine Linuxではなく標準のNode.jsイメージを使用
FROM node:18

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpnpm-lock.yamlをコピー
COPY package.json ./
COPY pnpm-lock.yaml ./

# pnpmをインストール
RUN npm install -g pnpm

# 依存関係をインストール
RUN pnpm install

# アプリケーションのソースをコピー
COPY . .

# ビルド
RUN pnpm build

# アプリケーションを起動
CMD ["pnpm", "start"]