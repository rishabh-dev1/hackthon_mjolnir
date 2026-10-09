import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/ProductCard'
import { Suspense } from 'react'

async function ProductList() {
  const products = await prisma.product.findMany({
    take: 50,
    orderBy: {
      rating: 'desc'
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="bg-[#0d0d0d] min-h-screen text-white font-sans selection:bg-white selection:text-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="inline-block mb-10 border border-white/10 rounded-full px-5 py-1.5 bg-[#1a1a1a]">
          <span className="text-sm font-medium text-gray-300">New spring collection 2024</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-medium leading-[1.1] tracking-tight text-white max-w-5xl mx-auto mb-8">
          Where style speaks, trends resonate, fashion flourishes
        </h1>
        
        <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-sm md:text-base leading-relaxed">
          Unveiling a fashion destination where trends blend seamlessly with your individual style aspirations. Discover today!
        </p>
        
        <button className="bg-white hover:bg-gray-200 text-black font-semibold py-3 px-8 rounded-full shadow-sm transition-transform active:scale-95 flex items-center mx-auto space-x-2">
          <span>New collection</span>
          <div className="bg-black text-white rounded-full p-1 ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 pb-32">
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        }>
          <ProductList />
        </Suspense>
      </div>
    </div>
  )
}
