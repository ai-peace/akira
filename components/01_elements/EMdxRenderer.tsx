'use client'

import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { useEffect, useState } from 'react'

interface EMdxRendererProps {
  content: string
  className?: string
}

export const EMdxRenderer = ({ content, className = '' }: EMdxRendererProps) => {
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

  return (
    <div className={`prose max-w-none dark:prose-invert ${className}`}>
      <MDXRemote {...mdxSource} />
    </div>
  )
}
