// next.config.js (ESM構文)
import nextPWA from 'next-pwa'

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
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
      config.externals = [...(config.externals || []), '@libsql/client']
    }

    // punycode警告を抑制
    config.ignoreWarnings = [{ module: /node_modules\/punycode/ }]

    return config
  },
  // Node.js環境の設定
  experimental: {
    serverComponentsExternalPackages: ['punycode'],
  },
})

export default nextConfig
