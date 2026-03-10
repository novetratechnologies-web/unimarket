// components/category/CategorySkeleton.jsx
import React from 'react';
import { motion } from 'framer-motion';

const CategorySkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Banner Skeleton */}
      <div className="relative h-[500px] overflow-hidden bg-gray-200 animate-pulse">
        {/* Gradient overlay skeleton */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/20 to-transparent" />
        
        {/* Content skeleton */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="w-full max-w-3xl">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-4 w-16 bg-gray-300 rounded"></div>
              <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
              <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
              <div className="h-6 w-24 bg-gray-300 rounded-full"></div>
            </div>

            {/* Title and icon skeleton */}
            <div className="flex items-center gap-6 mb-4">
              <div className="w-20 h-20 bg-gray-300 rounded-2xl"></div>
              <div className="h-16 w-64 bg-gray-300 rounded-lg"></div>
            </div>

            {/* Description skeleton */}
            <div className="space-y-2 mb-6">
              <div className="h-5 w-full bg-gray-300 rounded"></div>
              <div className="h-5 w-2/3 bg-gray-300 rounded"></div>
            </div>

            {/* Stats skeleton */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-8 w-32 bg-gray-300 rounded-full"></div>
              <div className="h-8 w-32 bg-gray-300 rounded-full"></div>
              <div className="h-8 w-32 bg-gray-300 rounded-full"></div>
            </div>

            {/* Buttons skeleton */}
            <div className="flex gap-3">
              <div className="h-12 w-32 bg-gray-300 rounded-xl"></div>
              <div className="h-12 w-32 bg-gray-300 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile filter button skeleton */}
        <div className="lg:hidden mb-4">
          <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                {/* Filter header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>

                {/* Price range filter */}
                <div className="mb-6">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                      <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                  </div>
                </div>

                {/* Brand filter */}
                <div className="mb-6">
                  <div className="h-4 w-16 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 flex-1 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Condition filter */}
                <div className="mb-6">
                  <div className="h-4 w-20 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 flex-1 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar skeleton */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="flex gap-1">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
                <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
                >
                  {/* Product image skeleton */}
                  <div className="h-48 bg-gray-200"></div>
                  
                  {/* Product content skeleton */}
                  <div className="p-4 space-y-3">
                    {/* Badges skeleton */}
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                    
                    {/* Title skeleton */}
                    <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                    
                    {/* Rating skeleton */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <div key={star} className="h-4 w-4 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                    
                    {/* Price skeleton */}
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded line-through"></div>
                    </div>
                    
                    {/* Seller info skeleton */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                ))}
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySkeleton;