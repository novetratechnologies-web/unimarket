import React, { useMemo } from 'react'
import { Store, TrendingUp, DollarSign, Star, ChevronRight } from 'lucide-react'

const VendorPerformance = ({ vendors = [], totalVendors = 0 }) => {
  const processedVendors = useMemo(() => {
    if (!vendors.length) {
      // Sample data
      return [
        { 
          id: '1', 
          name: 'Tech Haven', 
          revenue: 15234.56, 
          orders: 234, 
          products: 45, 
          rating: 4.8,
          growth: 12.5
        },
        { 
          id: '2', 
          name: 'Fashion Studio', 
          revenue: 12345.67, 
          orders: 189, 
          products: 67, 
          rating: 4.6,
          growth: 8.3
        },
        { 
          id: '3', 
          name: 'Home Essentials', 
          revenue: 9876.54, 
          orders: 156, 
          products: 34, 
          rating: 4.7,
          growth: -2.1
        },
        { 
          id: '4', 
          name: 'Sports Direct', 
          revenue: 8765.43, 
          orders: 123, 
          products: 56, 
          rating: 4.5,
          growth: 15.7
        },
        { 
          id: '5', 
          name: 'Book World', 
          revenue: 6543.21, 
          orders: 98, 
          products: 234, 
          rating: 4.9,
          growth: 5.4
        }
      ]
    }
    return vendors
  }, [vendors])

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Vendor Performance</h3>
            <p className="text-gray-600 text-sm mt-1">
              Top performing vendors this period
            </p>
          </div>
          <div className="bg-purple-50 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-purple-600">
              {totalVendors || 24} Total
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {processedVendors.map((vendor, index) => (
            <div 
              key={vendor.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center
                    ${index === 0 ? 'bg-yellow-100' : 
                      index === 1 ? 'bg-gray-100' : 
                      index === 2 ? 'bg-orange-100' : 'bg-blue-100'}`}
                  >
                    <Store className={`h-5 w-5 
                      ${index === 0 ? 'text-yellow-600' : 
                        index === 1 ? 'text-gray-600' : 
                        index === 2 ? 'text-orange-600' : 'text-blue-600'}`} 
                    />
                  </div>
                  {index < 3 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">#{index + 1}</span>
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                  <div className="flex items-center mt-1 space-x-3">
                    <span className="text-xs text-gray-500">
                      {vendor.orders} orders
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {vendor.products} products
                    </span>
                    <span className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600 ml-1">{vendor.rating}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  ${vendor.revenue.toLocaleString()}
                </p>
                <div className="flex items-center mt-1 justify-end">
                  {vendor.growth > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">+{vendor.growth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3 text-red-500 mr-1 transform rotate-180" />
                      <span className="text-xs text-red-600">{vendor.growth}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center">
            View All Vendors
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default VendorPerformance