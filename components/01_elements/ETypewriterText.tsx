import React from 'react'

type Props = {
  text: string
  className?: string
  speed?: number // 文字の出現スピード（ミリ秒）
  delay?: number // アニメーションの開始時間（ミリ秒）
  animate?: boolean // アニメーションを有効にするかどうかのフラグ
}

const ETypewriterText: React.FC<Props> = ({
  text,
  className = '',
  speed = 100,
  delay = 0,
  animate = true,
}) => {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          style={{
            display: 'inline-block',
            opacity: animate ? 0 : 1,
            animation: animate ? `fadeIn ${speed}ms forwards ${delay + index * speed}ms` : 'none',
          }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

export default ETypewriterText
