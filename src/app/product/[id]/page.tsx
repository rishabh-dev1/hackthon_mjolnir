import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Star, Shield, Truck, RotateCcw } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard' // for related products
import { AddToCartButton } from '@/components/AddToCartButton' // client component wrapper
import { PriceHistoryChart } from '@/components/PriceHistoryChart'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { id } = await params
  
  const product = await prisma.product.findUnique({
    where: { id: id },
    include: {
      priceHistory: true
    }
  })

  if (!product) {
    notFound()
  }

  // Get some related products from the same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      id: { not: product.id }
    },
    take: 5
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-16">
        
        {/* Product Image */}
        <div className="md:w-1/2 lg:w-2/5">
          <div className="rounded-lg border bg-white p-4 sticky top-24">
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="w-full h-auto object-contain max-h-[500px]" 
            />
          </div>
        </div>
        
        {/* Product Info */}
        <div className="md:w-1/2 lg:w-3/5 flex flex-col">
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">{product.title}</h1>
          <div className="text-gray-500 mb-4">{product.brand && `Brand: ${product.brand}`}</div>
          
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-3xl font-bold text-gray-900">₹{product.discountedPrice}</span>
            {product.originalPrice > product.discountedPrice && (
              <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
            )}
            {product.discountPercentage > 0 && (
              <span className="text-green-600 font-bold ml-2">{product.discountPercentage}% off</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-md text-green-700 font-medium text-lg">
              <span>{product.rating}</span>
              <Star className="h-4 w-4 fill-current" />
            </div>
            <span className="text-gray-500">{product.reviewCount} Ratings</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100 space-y-4">
             <div className="flex items-start space-x-3">
               <Truck className="h-6 w-6 text-pink-600 flex-shrink-0" />
               <div>
                 <p className="font-medium">Free Delivery</p>
                 <p className="text-sm text-gray-500">Expected delivery in {product.deliveryTime}</p>
               </div>
             </div>
             
             {product.codAvailable && (
               <div className="flex items-start space-x-3">
                 <Shield className="h-6 w-6 text-pink-600 flex-shrink-0" />
                 <div>
                   <p className="font-medium">Cash on Delivery Available</p>
                 </div>
               </div>
             )}
             
             <div className="flex items-start space-x-3">
               <RotateCcw className="h-6 w-6 text-pink-600 flex-shrink-0" />
               <div>
                 <p className="font-medium">{product.returnPolicy}</p>
               </div>
             </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">Product Details</h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{product.description}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white border rounded p-3">
                <span className="text-gray-500 block mb-1">Sizes Available</span>
                <span className="font-medium">{product.sizesAvailable}</span>
              </div>
              <div className="bg-white border rounded p-3">
                <span className="text-gray-500 block mb-1">Colors Available</span>
                <span className="font-medium">{product.colorsAvailable}</span>
              </div>
              <div className="bg-white border rounded p-3">
                <span className="text-gray-500 block mb-1">Material</span>
                <span className="font-medium">{product.material}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t flex gap-4 sticky bottom-0 bg-white py-4 z-10">
             <AddToCartButton product={product} />
          </div>
        </div>
      </div>
      
      {/* Price History Section */}
      {product.priceHistory && product.priceHistory.length > 0 && (
        <div className="mt-8 mb-16 max-w-4xl">
          <PriceHistoryChart history={product.priceHistory} />
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
