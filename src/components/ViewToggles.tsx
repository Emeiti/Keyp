'use client';

import React from 'react';

export interface ViewOptions {
  showAddress: boolean;
  showBrands: boolean;
  showCategories: boolean;
  showSocial: boolean;
  showContact: boolean;
}

interface ViewTogglesProps {
  options: ViewOptions;
  onToggle: (key: keyof ViewOptions) => void;
}

export default function ViewToggles({ options, onToggle }: ViewTogglesProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8 px-4">
      {Object.entries(options).map(([key, value]) => (
        <button
          key={key}
          onClick={() => onToggle(key as keyof ViewOptions)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all
            ${value 
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </button>
      ))}
    </div>
  );
} 