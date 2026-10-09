'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, XCircle, Package } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`)
        const data = await res.json()
        if (res.ok) {
          setOrder(data.order)
        } else {
          setError(data.error || 'Failed to load order')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [user, router, params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-white">
        <h1 className="text-2xl mb-4">Error loading order</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link href="/orders" className="text-blue-400 hover:underline">Back to Orders</Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen text-white max-w-4xl">
      <Link href="/orders" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
      </Link>
      
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Order #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-gray-400 text-sm">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-white/5 rounded-full flex items-center gap-2">
            {order.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : 
             order.status === 'PENDING' ? <Clock className="w-4 h-4 text-yellow-400" /> : 
             <XCircle className="w-4 h-4 text-red-400" />}
            <span className={`text-sm font-medium ${
              order.status === 'COMPLETED' ? 'text-green-400' : 
              order.status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-medium">Items Ordered</h2>
          {order.items.map((item: any) => (
            <div key={item.id} className="flex gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
              <div className="w-20 h-20 bg-black/40 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.product?.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium line-clamp-1">{item.product?.title || 'Unknown Product'}</h3>
                  <p className="text-sm text-gray-400 mt-1">{item.product?.brand}</p>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Shipping</span>
              <span className="text-green-400">Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-white border-t border-white/5 pt-3">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
