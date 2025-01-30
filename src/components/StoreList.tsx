'use client';

import React, { useState, useMemo } from 'react';
import { Store } from '../types/store';
import SearchBar from './SearchBar';
import ViewToggles, { ViewOptions } from './ViewToggles';

interface StoreListProps {
  stores: Store[];
}

export default function StoreList({ stores }: StoreListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showAddress: false,
    showBrands: false,
    showCategories: false,
    showSocial: false,
    showContact: false,
  });

  const filteredStores = useMemo(() => {
    return stores.filter(store => 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stores, searchQuery]);

  const handleToggle = (key: keyof ViewOptions) => {
    setViewOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div>
      <SearchBar onSearch={setSearchQuery} />
      <ViewToggles options={viewOptions} onToggle={handleToggle} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {filteredStores.map(store => (
          <div key={store.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">{store.name}</h2>
                  <a href={store.url} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 text-sm">
                    {store.url}
                  </a>
                </div>
                {store.metadata.logo && (
                  <img 
                    src={store.metadata.logo} 
                    alt={`${store.name} logo`}
                    className="w-16 h-16 object-contain rounded"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {store.metadata.hasWebshop && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Webshop
                  </span>
                )}
                {store.metadata.hasPhysicalShop && (
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    Physical Shop
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  store.subscription.status === 'active' 
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  {store.subscription.plan.charAt(0).toUpperCase() + store.subscription.plan.slice(1)}
                </span>
              </div>

              {viewOptions.showCategories && store.metadata.categories.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-1">
                    {store.metadata.categories.map(category => (
                      <span key={category} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewOptions.showBrands && store.metadata.brands.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Brands</h3>
                  <div className="flex flex-wrap gap-1">
                    {store.metadata.brands.map(brand => (
                      <span key={brand} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewOptions.showAddress && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Address</h3>
                  <p className="text-sm text-gray-600">
                    {store.contact.address.street}<br />
                    {store.contact.address.postalCode} {store.contact.address.city}
                  </p>
                </div>
              )}

              {viewOptions.showContact && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact</h3>
                  <p className="text-sm text-gray-600">
                    <a href={`mailto:${store.contact.email}`} className="text-blue-600 hover:text-blue-800">
                      {store.contact.email}
                    </a>
                    <br />
                    {store.contact.phone}
                  </p>
                </div>
              )}

              {viewOptions.showSocial && (store.contact.social.facebook || store.contact.social.instagram) && (
                <div className="flex gap-3">
                  {store.contact.social.facebook && (
                    <a href={store.contact.social.facebook} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 hover:text-blue-800">
                      Facebook
                    </a>
                  )}
                  {store.contact.social.instagram && (
                    <a href={store.contact.social.instagram} target="_blank" rel="noopener noreferrer"
                       className="text-pink-600 hover:text-pink-800">
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 