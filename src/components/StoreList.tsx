'use client';

import React from 'react';
import { Store } from '../types/store';

interface StoreListProps {
  stores: Store[];
}

export default function StoreList({ stores }: StoreListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map(store => (
        <div key={store.id} className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{store.name}</h2>
          {store.metadata.logo && (
            <img 
              src={store.metadata.logo} 
              alt={`${store.name} logo`}
              className="w-32 h-32 object-contain mb-4"
            />
          )}
          <p className="text-gray-600 mb-2">{store.url}</p>
          <div className="flex gap-2 mb-4">
            {store.metadata.hasWebshop && (
              <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                Webshop
              </span>
            )}
            {store.metadata.hasPhysicalShop && (
              <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                Physical Shop
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 