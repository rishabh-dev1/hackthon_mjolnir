import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Star, Shield, Truck, RotateCcw, Package, ShoppingBag } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { AddToCartButton } from '@/components/AddToCartButton'
import { PriceHistoryChart } from '@/components/PriceHistoryChart'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { priceHistory: true }
  })

  if (!product) notFound()

  const relatedProducts = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    take: 5
  })

  const inStock = product.availability !== 'Out of Stock'
  const hasDiscount = product.originalPrice > product.discountedPrice

  return (
    <div className="bg-background min-h-screen text-foreground pb-32 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* === Two-Column Product Layout === */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">

          {/* LEFT — Image Panel */}
          <div className="md:w-2/5 lg:w-[42%]">
            <div className="sticky top-24 rounded-2xl bg-card border border-border overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full aspect-[3/4] object-cover"
                />
              ) : (
                <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-muted text-muted-foreground gap-4">
                  <ShoppingBag className="h-16 w-16" />
                  <span className="text-sm">No image available</span>
                </div>
              )}
              {/* Availability badge */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  inStock
                    ? product.availability === 'Limited Stock'
                      ? 'bg-yellow-400/10 text-yellow-500 dark:text-yellow-400 border border-yellow-400/20'
                      : 'bg-green-400/10 text-green-600 dark:text-green-400 border border-green-400/20'
                    : 'bg-red-400/10 text-red-600 dark:text-red-400 border border-red-400/20'
                }`}>
                  {product.availability}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — Info Panel */}
          <div className="md:w-3/5 lg:w-[58%] flex flex-col gap-6">

            {/* Title + Brand */}
            <div>
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">{product.brand}</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-snug">{product.title}</h1>
            </div>

            {/* Price Block */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground">₹{product.discountedPrice}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice}</span>
                  <span className="bg-green-500/15 text-green-600 dark:text-green-400 text-sm font-semibold px-2 py-0.5 rounded-full border border-green-500/20">
                    {product.discountPercentage}% off
                  </span>
                </>
              )}
            </div>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/20 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{product.rating}</span>
                  <Star className="h-3.5 w-3.5 fill-green-600 dark:fill-green-400 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">{product.reviewCount.toLocaleString()} Ratings</span>
              </div>
            )}

            {/* Delivery & Service Card */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Free Delivery</p>
                  {product.deliveryTime && (
                    <p className="text-xs text-muted-foreground mt-0.5">Expected in {product.deliveryTime}</p>
                  )}
                </div>
              </div>
              {product.codAvailable && (
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-foreground">Cash on Delivery Available</p>
                </div>
              )}
              {product.returnPolicy && (
                <div className="flex items-start gap-3">
                  <RotateCcw className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-foreground">{product.returnPolicy}</p>
                </div>
              )}
            </div>

            {/* Product Details */}
            {product.description && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Product Details</h2>
                <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {product.sizesAvailable && (
                <div className="bg-card border border-border rounded-xl p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Sizes</span>
                  <span className="text-foreground font-medium">{product.sizesAvailable}</span>
                </div>
              )}
              {product.colorsAvailable && (
                <div className="bg-card border border-border rounded-xl p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Colors</span>
                  <span className="text-foreground font-medium">{product.colorsAvailable}</span>
                </div>
              )}
              {product.material && (
                <div className="bg-card border border-border rounded-xl p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Material</span>
                  <span className="text-foreground font-medium">{product.material}</span>
                </div>
              )}
              {product.sellerName && (
                <div className="bg-card border border-border rounded-xl p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Seller</span>
                  <span className="text-foreground font-medium">{product.sellerName}</span>
                </div>
              )}
            </div>

            {/* === Add to Cart — visible inline on desktop === */}
            <div className="hidden md:block mt-2">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>

        {/* Price History */}
        {product.priceHistory && product.priceHistory.length > 0 && (
          <div className="mt-16 max-w-4xl">
            <PriceHistoryChart history={product.priceHistory} />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === Mobile Sticky Add-to-Cart Bar === */}
      {/* Only shown on mobile (md:hidden). Does NOT cover desktop content. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-[env(safe-area-inset-bottom,12px)]">
        <AddToCartButton product={product} />
      </div>
    </div>
  )
}
