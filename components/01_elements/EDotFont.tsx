import React from 'react'
import { Pixelify_Sans, DotGothic16 } from 'next/font/google'

const pixelifySans = Pixelify_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const dotGothic16 = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

type Props = {
  text: string
  className?: string
  isJapanese?: boolean
  animate?: boolean
  speed?: number
  delay?: number
}

const EDotFont: React.FC<Props> = ({
  text,
  className = '',
  isJapanese = false,
  animate = false,
  speed = 10,
  delay = 0,
}) => {
  // 日本語が含まれているかどうかを判定する関数
  const containsJapanese = (str: string) => {
    return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
      str,
    )
  }

  // テキストに日本語が含まれているか、isJapaneseがtrueの場合はDotGothic16を使用
  const fontClass =
    isJapanese || containsJapanese(text) ? dotGothic16.className : pixelifySans.className

  if (!animate) {
    // 非アニメーション時は改行文字を<br>に変換
    return (
      <span className={`${fontClass} ${className}`}>
        {text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    )
  }

  return (
    <span className={`${fontClass} ${className}`}>
      {text.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`line-${lineIndex}`}>
          {line.split('').map((char, charIndex) => (
            <span
              key={`${lineIndex}-${charIndex}`}
              style={{
                display: char === ' ' ? 'inline' : 'inline-block',
                opacity: 0,
                animation: `fadeIn ${speed}ms forwards ${
                  delay + (lineIndex * line.length + charIndex) * speed
                }ms`,
                whiteSpace: 'pre',
              }}
            >
              {char}
            </span>
          ))}
          {lineIndex < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  )
}

export default EDotFont
