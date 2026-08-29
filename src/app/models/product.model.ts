export interface Product {
  id: string;
  sku?: string;
  name: string;
  slug?: string;
  category: string;
  sub_category?: string | null;
  subCategory?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  sub_category_name?: string | null;
  sub_category_slug?: string | null;
  price: number;
  discounted_price?: number;
  original_price?: number;
  originalPrice?: number;
  discount_type?: 'PERCENTAGE' | 'FLAT';
  discount_value?: number;
  discount_percent?: number;
  savings_amount?: number;
  has_discount?: boolean;
  rating: number;
  reviews_count?: number;
  reviewsCount?: number;
  image_url?: string;
  imageUrl: string;
  description: string;
  weight: string;
  stock: number;
  low_stock_threshold?: number;
  lowStockThreshold?: number;
  stock_status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  is_organic?: boolean;
  isOrganic?: boolean;
  is_bestseller?: boolean;
  isBestseller?: boolean;
  origin_region?: string;
  originRegion?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductsSummary {
  totalProducts: number;
  totalUnitsInStock: number;
  totalCatalogValuation: number;
  outOfStockCount: number;
  lowStockCount: number;
  discountedProductsCount: number;
  organicProductsCount: number;
  bestsellerProductsCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
