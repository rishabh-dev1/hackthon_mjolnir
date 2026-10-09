import { Suspense } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { SearchFilters } from '@/components/SearchFilters'
import { ProductGridSkeleton } from '@/components/ProductSkeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type SearchParams = {
  search?: string
  category?: string
  sort?: string
  page?: string
  minPrice?: string
  maxPrice?: string
}

async function fetchProducts(params: SearchParams) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.category) qs.set('category', params.category)
  if (params.sort) qs.set('sort', params.sort)
  if (params.page) qs.set('page', params.page)
  if (params.minPrice) qs.set('minPrice', params.minPrice)
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice)
  qs.set('limit', '20')

  try {
    const res = await fetch(`${baseUrl}/api/products?${qs.toString()}`, {
      cache: 'no-store',
    })
    if (!res.ok) return { products: [], pagination: { page: 1, totalPages: 1, total: 0 } }
    return res.json()
  } catch {
    return { products: [], pagination: { page: 1, totalPages: 1, total: 0 } }
  }
}

async function ProductList({ searchParamsPromise }: { searchParamsPromise: Promise<SearchParams> }) {
  const params = await searchParamsPromise
  const { products, pagination } = await fetchProducts(params)
  const currentPage = parseInt(params.page || '1')

  const buildPageUrl = (page: number) => {
    const p = new URLSearchParams(params as Record<string, string>)
    p.set('page', String(page))
    return `/?${p.toString()}`
  }

  return (
    <>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-xl font-medium text-gray-300 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-gray-500 text-sm mb-6">
            Showing {(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, pagination.total)} of {pagination.total} products
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-16">
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 text-gray-300 px-5 py-2.5 rounded-full hover:border-white/30 transition-colors text-sm"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              ) : (
                <div className="px-5 py-2.5 rounded-full opacity-0 pointer-events-none">Previous</div>
              )}

              <span className="text-gray-500 text-sm">
                Page {currentPage} of {pagination.totalPages}
              </span>

              {currentPage < pagination.totalPages ? (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 text-gray-300 px-5 py-2.5 rounded-full hover:border-white/30 transition-colors text-sm"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <div className="px-5 py-2.5 rounded-full opacity-0 pointer-events-none">Next</div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Products section */}
      <div className="container mx-auto px-4 pb-32 pt-12">
        <Suspense fallback={null}>
          <SearchFilters />
        </Suspense>

        <Suspense fallback={<ProductGridSkeleton count={20} />}>
          <ProductList searchParamsPromise={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
