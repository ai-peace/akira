import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    theme_color: '#000000',
    background_color: '#ffffff',
    icons: [
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: 'icon512_maskable.png',
        type: 'image/png',
      },
      { purpose: 'any', sizes: '512x512', src: 'icon512_rounded.png', type: 'image/png' },
    ],
    orientation: 'any',
    display: 'standalone',
    dir: 'auto',
    lang: 'ja',
    name: 'AKIRA',
    short_name: 'AKIRA',
    start_url: '/',
    scope: '/',
  }
}
