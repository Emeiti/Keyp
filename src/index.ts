import axios, { AxiosInstance } from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

interface KeypApiConfig {
  token: string;
  baseUrl?: string;
}

interface StoreParams {
  active?: boolean;
  hasWebshop?: boolean;
  hasPhysicalShop?: boolean;
  category?: string;
}

interface WishlistInput {
  name: string;
  items?: {
    productId: string;
    storeId: string;
    priority: number;
    notes?: string;
  }[];
}

interface GiftIdeaParams {
  occasion?: string;
  targetAudience?: string[];
  maxPrice?: number;
  storeId?: string;
}

export class KeypApi {
  private client: AxiosInstance;
  private auth: any;

  constructor(config: KeypApiConfig) {
    // Initialize Firebase auth
    const app = initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      projectId: 'keyp-fo'
    });
    this.auth = getAuth(app);

    // Initialize axios client
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.keyp.fo/v1',
      headers: {
        Authorization: `Bearer ${config.token}`
      }
    });
  }

  stores = {
    list: async (params?: StoreParams) => {
      const response = await this.client.get('/stores', { params });
      return response.data;
    },

    get: async (id: string) => {
      const response = await this.client.get(`/stores/${id}`);
      return response.data;
    },

    products: {
      list: async (storeId: string, params?: {
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
      }) => {
        const response = await this.client.get(`/stores/${storeId}/products`, { params });
        return response.data;
      }
    }
  };

  wishlists = {
    list: async () => {
      const response = await this.client.get('/wishlists');
      return response.data;
    },

    create: async (data: WishlistInput) => {
      const response = await this.client.post('/wishlists', data);
      return response.data;
    },

    get: async (id: string) => {
      const response = await this.client.get(`/wishlists/${id}`);
      return response.data;
    },

    update: async (id: string, data: Partial<WishlistInput>) => {
      const response = await this.client.put(`/wishlists/${id}`, data);
      return response.data;
    },

    viewers: {
      add: async (wishlistId: string, userId: string) => {
        const response = await this.client.post(`/wishlists/${wishlistId}/viewers`, { userId });
        return response.data;
      },
      remove: async (wishlistId: string, userId: string) => {
        const response = await this.client.delete(`/wishlists/${wishlistId}/viewers/${userId}`);
        return response.data;
      }
    }
  };

  giftIdeas = {
    list: async (params?: GiftIdeaParams) => {
      const response = await this.client.get('/giftideas', { params });
      return response.data;
    },

    create: async (data: {
      title: string;
      description: string;
      price: number;
      imageUrl: string;
      categories: string[];
      targetAudience: string[];
      occasions: string[];
      products: { productId: string; required: boolean; }[];
    }) => {
      const response = await this.client.post('/giftideas', data);
      return response.data;
    }
  };
}

// Export types
export type { KeypApiConfig, StoreParams, WishlistInput, GiftIdeaParams }; 