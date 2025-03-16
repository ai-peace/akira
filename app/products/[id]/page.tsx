'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductEntity } from '@/domains/entities/product.entity'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingCart } from 'lucide-react'

export default function ProductDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<ProductEntity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      // URLパラメータから商品情報を取得
      const productData = searchParams.get('productData')
      if (productData) {
        setProduct(JSON.parse(decodeURIComponent(productData)))
      }
    } catch (error) {
      console.error('Failed to parse product data:', error)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
        </div>
        <Card className="p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold">商品が見つかりませんでした</h1>
          <p>申し訳ありませんが、指定された商品情報が見つかりませんでした。</p>
          <Button onClick={() => router.back()} className="mt-4">
            前のページに戻る
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* 商品画像 */}
        <div className="relative h-[300px] w-full overflow-hidden rounded-lg md:h-[500px]">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title.en}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {/* 商品情報 */}
        <div className="flex flex-col">
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">{product.title.en}</h1>
          <p className="mb-4 text-sm text-gray-600">{product.title.ja}</p>

          <div className="mb-4 flex items-center">
            {/* ショップ情報 */}
            <div className="flex items-center">
              {product.shopIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.shopIconUrl} alt={product.shopName} className="mr-2 h-5 w-5" />
              )}
              <span className="text-sm text-gray-600">{product.shopName}</span>
            </div>
          </div>

          {/* 価格 */}
          <div className="mb-6">
            <div className="text-3xl font-bold text-red-500">
              ${Math.round(product.price / 150).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {product.currency} {product.price.toLocaleString()}
            </div>
          </div>

          {/* 在庫状況 */}
          <div className="mb-6">
            <div
              className={`inline-block rounded-full px-3 py-1 text-sm ${
                product.status === 'In Stock'
                  ? 'bg-green-100 text-green-800'
                  : product.status === 'Out of Stock'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {product.status}
            </div>
          </div>

          {/* 商品説明 */}
          {product.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">商品説明</h2>
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>
          )}

          {/* コンディション */}
          {product.condition && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">コンディション</h2>
              <p className="text-sm text-gray-700">{product.condition}</p>
            </div>
          )}

          {/* 購入ボタン */}
          <div className="mt-auto flex flex-col gap-4 sm:flex-row">
            <Button
              className="flex items-center justify-center"
              disabled={product.status === 'Out of Stock'}
              onClick={() => window.open(product.url, '_blank')}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              購入ページへ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
