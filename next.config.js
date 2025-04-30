/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // webpackのキャッシュを無効化
    config.cache = false
    // READMEファイルを無視する設定を追加
    config.module.rules.push({
      test: /\.md$/,
      loader: 'ignore-loader',
    })

    // バイナリファイルを無視する設定を追加
    config.module.rules.push({
      test: /\.node$/,
      loader: 'ignore-loader',
    })

    // @libsqlをexternalsに追加
    if (isServer) {
      config.externals = [...(config.externals || []), '@libsql/client', '@mastra/core']
    }

    // punycode警告を抑制
    config.ignoreWarnings = [{ module: /node_modules\/punycode/ }]

    // Cloudflareのスキームを処理
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'cloudflare:sockets': false,
    }

    return config
  },
  // Node.js環境の設定
  experimental: {
    serverComponentsExternalPackages: ['punycode', '@mastra/core'],
  },
}

export default nextConfig
