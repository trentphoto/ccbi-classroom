"use client";

import React from 'react';

// Skeleton component for loading states
const Skeleton = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  />
);

// Skeleton for stats cards
const StatsCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow-md border">
    <div className="flex items-center">
      <Skeleton className="p-2 w-10 h-10 rounded-lg" />
      <div className="ml-4 flex-1">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-12" />
      </div>
    </div>
  </div>
);

// Skeleton for tab navigation
const TabSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md border mb-6">
    <div className="border-b border-gray-200">
      <div className="flex space-x-8 px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-4 px-1">
            <div className="flex items-center">
              <Skeleton className="h-4 w-16 mr-2" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton for card grid (classes/lessons)
const CardGridSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-lg shadow-md border">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-2" />
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for table
const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="min-w-full">
      {/* Table header */}
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex space-x-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-6">
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  {colIndex === 3 ? (
                    <Skeleton className="h-6 w-16 rounded-full" />
                  ) : colIndex === 4 ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <Skeleton className="h-4 w-24" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Main dashboard skeleton component
export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Tabs skeleton */}
        <TabSkeleton />

        {/* Content skeleton */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <CardGridSkeleton />
        </div>
      </div>
    </div>
  );
}

// Alternative skeleton for table view
export function DashboardTableSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Tabs skeleton */}
        <TabSkeleton />

        {/* Table content skeleton */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}

// Simple skeleton for individual components
export function SimpleSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}
