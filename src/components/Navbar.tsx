'use client'

import Link from 'next/link'
import { ShoppingCart, Search, User, Compass } from 'lucide-react'
import { useCartStore, useNetworkStore } from '@/store/store'
import { useState, useEffect } from 'react'

export function Navbar() {
  const cartItems = useCartStore((state) => state.items)
  const { liteMode, setLiteMode } = useNetworkStore()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <nav className="w-full bg-[#0d0d0d] pt-6 pb-4">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-14 items-center justify-between">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-white" />
              <span className="text-xl font-bold tracking-widest text-white uppercase">
                Meesho
              </span>
            </Link>
          </div>
          
          {/* Center Navigation Pill */}
          <div className="hidden md:flex items-center justify-center bg-[#1a1a1a] rounded-full px-6 py-2 border border-white/5">
            <div className="flex items-center space-x-8 text-sm font-medium text-gray-300">
              <Link href="/" className="bg-white text-black px-4 py-1.5 rounded-full transition-colors">Home</Link>
              <Link href="/" className="hover:text-white transition-colors">Shop</Link>
              <Link href="/" className="hover:text-white transition-colors">Sale</Link>
              <Link href="/" className="hover:text-white transition-colors">Showcase</Link>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-4 text-sm font-medium">
            {mounted && (
              <button 
                onClick={() => setLiteMode(!liteMode)}
                title="Bharat Lite Mode - Optimize for slow networks"
                className={`hidden md:flex items-center justify-center px-4 py-2 rounded-full border transition-all ${
                  liteMode 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                    : 'bg-[#1a1a1a] text-gray-300 hover:text-white border-white/5'
                }`}
              >
                {liteMode ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m2 2 20 20"/><path d="m8.5 16.5 7-7"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/></svg> Lite: ON</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg> Lite Mode</>
                )}
              </button>
            )}

            <button className="text-gray-300 hover:text-white transition-colors flex items-center justify-center h-10 w-10 rounded-full bg-[#1a1a1a] border border-white/5">
              <Search className="h-4 w-4" />
            </button>

            <Link href="/cart" className="relative text-gray-300 hover:text-white transition-colors flex items-center justify-center h-10 w-10 rounded-full bg-[#1a1a1a] border border-white/5">
              <ShoppingCart className="h-4 w-4" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:flex items-center space-x-3 ml-2 border-l border-white/10 pl-6">
              <button className="text-gray-300 hover:text-white transition-colors px-3 py-2">Login</button>
              <button className="bg-white text-black hover:bg-gray-200 transition-colors px-5 py-2 rounded-full">Sign up</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
