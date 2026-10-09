'use client'

import { useCartStore, useNetworkStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus, AlertTriangle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { checkoutAction } from '@/actions/checkout'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const { liteMode } = useNetworkStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      // Offline fallback for Bharat Lite Mode
      if (!navigator.onLine) {
         setError('You are offline. Cart saved locally. Checkout when connection is restored.')
         setLoading(false)
         return
      }

      // Optimistic API Call for Concurrency-Safe Checkout
      const result = await checkoutAction(items.map(i => ({ productId: i.productId, quantity: i.quantity })))
      
      if (result.success) {
        setSuccess('Checkout successful! Inventory reserved for 3 minutes.')
        clearCart()
      } else {
        setError(result.error || 'Failed to checkout. Items may be out of stock.')
      }
    } catch (err) {
      setError('A network error occurred. Please try again.')
    }
    setLoading(false)
  }

  if (items.length === 0 && !success) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <img src="/empty-cart.png" alt="Empty Cart" className="h-48 w-48 object-contain mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link href="/">
          <Button className="bg-pink-600 hover:bg-pink-700">Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6 flex items-center">
          <ShieldCheck className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {!success && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.productId} className="flex bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                {!liteMode && (
                  <div className="h-24 w-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                )}
                
                <div className="ml-4 flex-1 flex flex-col">
                  <div>
                    <div className="flex justify-between">
                      <h3 className="text-base font-medium text-gray-900 line-clamp-2">{item.title}</h3>
                      <p className="ml-4 text-base font-medium text-gray-900">₹{item.price}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-end justify-between text-sm">
                    <div className="flex items-center border rounded-md">
                      <button 
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="p-2 hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="font-medium text-pink-600 hover:text-pink-500 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <div className="flow-root">
              <dl className="-my-4 text-sm divide-y divide-gray-200">
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-900">₹{total}</dd>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd className="font-medium text-green-600">Free</dd>
                </div>
                <div className="py-4 flex items-center justify-between font-bold text-lg">
                  <dt className="text-gray-900">Order Total</dt>
                  <dd className="text-gray-900">₹{total}</dd>
                </div>
              </dl>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleCheckout} 
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 py-6 text-lg"
              >
                {loading ? 'Processing...' : 'Secure Checkout'}
              </Button>
              <p className="mt-4 text-xs text-gray-500 text-center">
                Concurrency-Safe Checkout ensures your inventory is locked for 3 mins.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
