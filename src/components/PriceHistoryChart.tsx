'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { format, subDays, isAfter } from 'date-fns'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

type HistoryPoint = {
  id: string
  price: number
  recordedAt: string | Date
}

export function PriceHistoryChart({ history }: { history: HistoryPoint[] }) {
  const [period, setPeriod] = useState<7 | 30 | 90>(30)

  // Sort history chronologically
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
  }, [history])

  // Filter based on selected period
  const chartData = useMemo(() => {
    const cutoffDate = subDays(new Date(), period)
    const filtered = sortedHistory.filter(point => isAfter(new Date(point.recordedAt), cutoffDate))
    
    // Format for recharts
    return filtered.map(point => ({
      date: format(new Date(point.recordedAt), 'MMM dd'),
      price: point.price,
      fullDate: format(new Date(point.recordedAt), 'MMM dd, yyyy')
    }))
  }, [sortedHistory, period])

  if (!chartData || chartData.length < 2) {
    return <div className="text-gray-500 italic p-4 text-center border rounded-xl bg-gray-50">Not enough price history available.</div>
  }

  // Calculate insights
  const prices = chartData.map(d => d.price)
  const currentPrice = prices[prices.length - 1]
  const lowestPrice = Math.min(...prices)
  const highestPrice = Math.max(...prices)
  const oldestPrice = prices[0]
  
  const percentChange = ((currentPrice - oldestPrice) / oldestPrice) * 100
  const isDrop = percentChange < 0
  const isCurrentLowest = currentPrice === lowestPrice

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Price History Insights</h2>
          <p className="text-sm text-gray-500">Track price movements to get the best deal.</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                period === days 
                  ? 'bg-white text-pink-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Current Price</p>
          <p className="text-2xl font-bold text-gray-900">₹{currentPrice}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Lowest Price</p>
          <p className="text-2xl font-bold text-green-600">₹{lowestPrice}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Highest Price</p>
          <p className="text-2xl font-bold text-gray-900">₹{highestPrice}</p>
        </div>
        
        <div className={`p-4 rounded-xl border ${isDrop ? 'bg-green-50 border-green-100' : percentChange > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Change ({period}D)</p>
          <div className={`flex items-center text-xl font-bold ${isDrop ? 'text-green-600' : percentChange > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {isDrop ? <TrendingDown className="h-5 w-5 mr-1" /> : percentChange > 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <Minus className="h-5 w-5 mr-1" />}
            {Math.abs(percentChange).toFixed(1)}%
          </div>
        </div>
      </div>

      {isCurrentLowest && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <span className="flex h-2 w-2 relative mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <strong>Great Deal!</strong>&nbsp;The current price is the lowest it has been in the last {period} days.
        </div>
      )}

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }} 
              dy={10}
            />
            <YAxis 
              domain={['dataMin - 100', 'dataMax + 100']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
              formatter={(value: any) => [`₹${value}`, 'Price']}
              labelFormatter={(_, payload) => payload[0]?.payload.fullDate}
            />
            <ReferenceLine y={lowestPrice} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#DB2777" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6, fill: '#DB2777', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
