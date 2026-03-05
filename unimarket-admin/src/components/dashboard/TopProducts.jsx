import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const TopProducts = () => {
  const products = [
    { name: 'Wireless Headphones', sales: 245, revenue: '$21,945', growth: '+24%' },
    { name: 'Smart Watch Series 5', sales: 189, revenue: '$37,611', growth: '+18%' },
    { name: 'Fitness Tracker Pro', sales: 156, revenue: '$15,444', growth: '+32%' },
    { name: 'Laptop Stand', sales: 132, revenue: '$6,732', growth: '+12%' },
    { name: 'Phone Case Pro', sales: 128, revenue: '$3,584', growth: '+8%' },
  ]

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-100 to-blue-100 rounded-lg flex items-center justify-center text-primary-600 font-bold">
              {index + 1}
            </div>
            <div>
              <div className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                {product.name}
              </div>
              <div className="text-sm text-gray-500">{product.sales} units sold</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">{product.revenue}</div>
            <div className={`flex items-center justify-end text-sm ${
              product.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.growth.startsWith('+') ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {product.growth}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TopProducts