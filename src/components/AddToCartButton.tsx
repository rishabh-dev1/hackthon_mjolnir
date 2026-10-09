'use client'

import { useCartStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

export function AddToCartButton({ product }: { product: any }) {
  const addItem = useCartStore(state => state.addItem)

  return (
    <Button
      onClick={() => {
        addItem({
          productId: product.id,
          title: product.title,
          price: product.discountedPrice,
          imageUrl: product.imageUrl,
          quantity: 1
        })
      }}
      className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 py-6 px-12 text-lg rounded-md flex-1"
      disabled={product.availability === 'Out of Stock'}
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {product.availability === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
    </Button>
  )
}
