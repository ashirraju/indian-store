export interface SubCategory {
  id: string;
  category_id?: string;
  category_name?: string;
  name: string;
  slug: string;
  display_order: number;
  products_count?: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  display_order: number;
  products_count?: number;
  created_at?: string;
  sub_categories?: SubCategory[];
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  icon?: string;
  displayOrder?: number;
}

export interface CreateSubCategoryInput {
  name: string;
  slug?: string;
  displayOrder?: number;
}
