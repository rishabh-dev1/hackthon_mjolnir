'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function OrdersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
          <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No orders yet</h2>
          <p className="text-gray-400 mb-6">Looks like you haven't made your first purchase.</p>
          <Link href="/" className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link 
              href={`/orders/${order.id}`} 
              key={order.id}
              className="block bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-colors group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-gray-400 text-sm">Order #{order.id.slice(-8).toUpperCase()}</span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-400 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
                
                <div className="flex items-center justify-between md:justify-end gap-6 border-t border-white/5 pt-4 md:border-0 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-gray-400 text-sm mb-1">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</div>
                    <div className="text-lg font-semibold">₹{order.total.toFixed(2)}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
