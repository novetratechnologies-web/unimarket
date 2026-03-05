import React, { useState } from 'react'

const SalesChart = () => {
  const [data] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
    previousYear: [10000, 15000, 13000, 18000, 20000, 25000, 23000, 28000, 27000, 32000, 31000, 38000]
  })

  const maxValue = Math.max(...data.values, ...data.previousYear)

  return (
    <div>
      <div className="h-64 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t border-gray-100"></div>
          ))}
        </div>
        
        {/* Chart bars */}
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {data.values.map((value, index) => (
            <div key={index} className="flex flex-col items-center w-8">
              {/* Current year bar */}
              <div 
                className="w-3 bg-gradient-to-t from-primary-500 to-blue-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer group relative"
                style={{ height: `${(value / maxValue) * 100}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  ${value.toLocaleString()}
                </div>
              </div>
              
              {/* Previous year bar */}
              <div 
                className="w-2 bg-gray-300 rounded-t-lg mt-1 transition-all hover:opacity-80 cursor-pointer group relative"
                style={{ height: `${(data.previousYear[index] / maxValue) * 100}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  ${data.previousYear[index].toLocaleString()}
                </div>
              </div>
              
              {/* Month label */}
              <div className="text-xs text-gray-500 mt-2">{data.labels[index]}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chart legend */}
      <div className="flex items-center justify-center space-x-4 mt-6">
        <div className="flex items-center">
          <div className="h-3 w-3 bg-gradient-to-t from-primary-500 to-blue-400 rounded mr-2"></div>
          <span className="text-sm text-gray-600">This Year</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 bg-gray-300 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Last Year</span>
        </div>
      </div>
    </div>
  )
}

export default SalesChart