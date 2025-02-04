export interface Store {
  id: string;
  name: string;
  url: string;
  active: boolean;
  metadata: {
    logo: string;
    hasWebshop: boolean;
    hasPhysicalShop: boolean;
    categories: string[];
    brands: string[];
  };
  contact: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
    };
    social: {
      facebook?: string;
      instagram?: string;
    };
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium';
    status: 'active' | 'expired';
    features: {
      wishlist: boolean;
      giftIdeas: boolean;
    };
    limits: {
      giftIdeasCount: number;
    };
  };
} 