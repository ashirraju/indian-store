export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  description: string;
  weight: string;
  stock: number;
  isOrganic?: boolean;
  isBestseller?: boolean;
  originRegion: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
