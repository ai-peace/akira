'use client'

import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { useEffect, useState } from 'react'

interface EMdxRendererProps {
  content: string
  className?: string
  onSearch?: (query: string) => void
}

// カスタムリンクコンポーネント
const CustomLink = ({
  href,
  children,
  onSearch,
}: {
  href: string
  children: React.ReactNode
  onSearch?: (query: string) => void
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onSearch) {
      // hrefまたはテキストコンテンツを検索クエリとして使用
      const searchQuery = href.startsWith('http') ? children?.toString() || href : href
      onSearch(searchQuery)
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="cursor-pointer text-blue-500 hover:text-blue-700 hover:underline"
    >
      {children}
    </a>
  )
}

export const EMdxRenderer = ({ content, className = '', onSearch }: EMdxRendererProps) => {
  const [mdxSource, setMdxSource] = useState<any>(null)

  useEffect(() => {
    const prepareMdx = async () => {
      if (!content) return
      const mdxSource = await serialize(content)
      setMdxSource(mdxSource)
    }

    prepareMdx()
  }, [content])

  if (!mdxSource) {
    return null
  }

  // MDXコンポーネントのカスタマイズ
  const components = {
    a: (props: any) => <CustomLink {...props} onSearch={onSearch} />,
  }

  return (
    <div className={`prose max-w-none dark:prose-invert ${className}`}>
      <MDXRemote {...mdxSource} components={components} />
    </div>
  )
}
