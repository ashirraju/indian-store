import { Injectable, inject } from '@angular/core';
import { Category, CreateCategoryInput, CreateSubCategoryInput, SubCategory } from '../models/category.model';
import { Product, ProductsSummary } from '../models/product.model';
import { AppKeycloakService } from './app-keycloak.service';
import { API_CONFIG } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = API_CONFIG.BASE_URL;
  private readonly keycloak = inject(AppKeycloakService);

  private getAuthHeaders(role = 'Admin'): Record<string, string> {
    const token = this.keycloak.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-mock-role': role
    };
  }

  async checkHealth(): Promise<any> {
    try {
      const res = await fetch(API_CONFIG.HEALTH_URL);
      return await res.json();
    } catch {
      return { status: 'OFFLINE' };
    }
  }

  // ==========================================
  // CATEGORIES API
  // ==========================================

  async getCategories(): Promise<{ success: boolean; totalCount: number; data: Category[] }> {
    const res = await fetch(`${this.baseUrl}/categories`);
    return await res.json();
  }

  async getCategory(idOrSlug: string): Promise<{ success: boolean; data: Category }> {
    const res = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(idOrSlug)}`);
    return await res.json();
  }

  async createCategory(payload: CreateCategoryInput, role = 'Admin'): Promise<{ success: boolean; message: string; data: Category }> {
    const res = await fetch(`${this.baseUrl}/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async updateCategory(id: string, payload: CreateCategoryInput, role = 'Admin'): Promise<{ success: boolean; message: string; data: Category }> {
    const res = await fetch(`${this.baseUrl}/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async deleteCategory(id: string, force = true, role = 'Admin'): Promise<{ success: boolean; message: string; deletedCategoryId: string }> {
    const res = await fetch(`${this.baseUrl}/categories/${id}?force=${force}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async getSubCategories(categoryId: string): Promise<{ success: boolean; totalCount: number; data: SubCategory[] }> {
    const res = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(categoryId)}/sub-categories`);
    return await res.json();
  }

  async createSubCategory(categoryId: string, payload: CreateSubCategoryInput, role = 'Admin'): Promise<{ success: boolean; message: string; data: SubCategory }> {
    const res = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(categoryId)}/sub-categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async updateSubCategory(id: string, payload: CreateSubCategoryInput, role = 'Admin'): Promise<{ success: boolean; message: string; data: SubCategory }> {
    const res = await fetch(`${this.baseUrl}/categories/sub-categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async deleteSubCategory(id: string, role = 'Admin'): Promise<{ success: boolean; message: string; deletedSubCategoryId: string }> {
    const res = await fetch(`${this.baseUrl}/categories/sub-categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  // ==========================================
  // PRODUCTS API
  // ==========================================

  async getProductsSummary(role = 'Admin'): Promise<{ success: boolean; data: ProductsSummary }> {
    const res = await fetch(`${this.baseUrl}/products/admin/summary`, {
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async getProducts(params?: {
    category?: string;
    subCategory?: string;
    search?: string;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | '';
    hasDiscount?: 'true' | 'false' | '';
    organic?: 'true' | 'false' | '';
    bestseller?: 'true' | 'false' | '';
    sort?: 'price-low' | 'price-high' | 'name-asc' | 'name-desc' | 'stock-low' | 'stock-high' | 'rating' | 'newest' | '';
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; totalCount: number; page: number; limit: number; totalPages: number; data: Product[] }> {
    const url = new URL(`${this.baseUrl}/products`);
    if (params?.category) url.searchParams.set('category', params.category);
    if (params?.subCategory) url.searchParams.set('subCategory', params.subCategory);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.stockStatus) url.searchParams.set('stockStatus', params.stockStatus);
    if (params?.hasDiscount) url.searchParams.set('hasDiscount', params.hasDiscount);
    if (params?.organic) url.searchParams.set('organic', params.organic);
    if (params?.bestseller) url.searchParams.set('bestseller', params.bestseller);
    if (params?.sort) url.searchParams.set('sort', params.sort);
    if (params?.page) url.searchParams.set('page', params.page.toString());
    if (params?.limit) url.searchParams.set('limit', params.limit.toString());

    const res = await fetch(url.toString());
    return await res.json();
  }

  async getProduct(idOrSku: string): Promise<{ success: boolean; data: Product }> {
    const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(idOrSku)}`);
    return await res.json();
  }

  async createProduct(payload: any, role = 'Admin'): Promise<{ success: boolean; message: string; data: Product }> {
    const res = await fetch(`${this.baseUrl}/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async updateProduct(idOrSku: string, payload: any, role = 'Admin'): Promise<{ success: boolean; message: string; data: Product }> {
    const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(idOrSku)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async deleteProduct(idOrSku: string, role = 'Admin'): Promise<{ success: boolean; message: string; deletedProductId: string }> {
    const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(idOrSku)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async updateProductDiscount(
    idOrSku: string,
    discountData: { originalPrice?: number; discountType?: 'PERCENTAGE' | 'FLAT'; discountValue?: number; price?: number },
    role = 'Admin'
  ): Promise<{ success: boolean; message: string; data: Product }> {
    const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(idOrSku)}/discount`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(discountData)
    });
    return await res.json();
  }

  async updateProductStock(
    idOrSku: string,
    stockData: { stock: number; reason?: string },
    role = 'Admin'
  ): Promise<{ success: boolean; message: string; data: any }> {
    const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(idOrSku)}/stock`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(stockData)
    });
    return await res.json();
  }

  async toggleProductFlag(
    idOrSku: string,
    flags: { isBestseller?: boolean; isOrganic?: boolean },
    role = 'Admin'
  ): Promise<{ success: boolean; message: string; data: Product }> {
    const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(idOrSku)}/toggle`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(flags)
    });
    return await res.json();
  }

  async bulkDeleteProducts(productIds: string[], role = 'Admin'): Promise<{ success: boolean; deletedCount: number; deletedIds: string[] }> {
    const res = await fetch(`${this.baseUrl}/products/bulk/delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify({ productIds })
    });
    return await res.json();
  }

  async bulkImportProducts(
    payload: { csv?: string; items?: any[] },
    role = 'Admin'
  ): Promise<{
    success: boolean;
    message: string;
    summary: { total: number; created: number; updated: number; failed: number; errors: any[] };
    data: Product[];
  }> {
    const res = await fetch(`${this.baseUrl}/products/bulk/import`, {
      method: 'POST',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  // ==========================================
  // COUPONS, ORDERS & INVENTORY APIs
  // ==========================================

  async validateCoupon(code: string, subtotal: number, userEmail?: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal, userEmail })
    });
    return await res.json();
  }

  async getOrders(params?: {
    status?: string;
    customerEmail?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }, role = 'Admin'): Promise<{ success: boolean; totalCount: number; page: number; limit: number; totalPages: number; data: any[] }> {
    const url = new URL(`${this.baseUrl}/orders`);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.customerEmail) url.searchParams.set('customerEmail', params.customerEmail);
    if (params?.page) url.searchParams.set('page', params.page.toString());
    if (params?.limit) url.searchParams.set('limit', params.limit.toString());
    if (params?.sort) url.searchParams.set('sort', params.sort);

    const res = await fetch(url.toString(), {
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async getOrder(id: string, role = 'Admin'): Promise<{ success: boolean; data: any }> {
    const res = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(id)}`, {
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async checkoutOrder(orderData: {
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: {
      fullName: string;
      phone: string;
      email?: string;
      addressLine: string;
      city: string;
      state: string;
      pincode: string;
    };
    couponCode?: string;
    paymentMethod: string;
  }, role = 'Customer'): Promise<{
    success: boolean;
    message: string;
    data: any;
    error?: string;
  }> {
    const res = await fetch(`${this.baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(orderData)
    });
    return await res.json();
  }

  async updateOrderStatus(
    id: string,
    payload: { status: string; notes?: string; assignedDeliveryAgent?: string },
    role = 'Operations'
  ): Promise<{ success: boolean; message: string; data: any }> {
    const res = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async cancelOrder(id: string, reason?: string, role = 'Customer'): Promise<{ success: boolean; message: string; data: any }> {
    const res = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify({ reason: reason || 'Customer requested cancellation' })
    });
    return await res.json();
  }

  async updateOrderPayment(
    id: string,
    payload: { paymentStatus: string; paymentMethod?: string },
    role = 'Admin'
  ): Promise<{ success: boolean; message: string; data: any }> {
    const res = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(id)}/payment`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(role),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async getInventory(lowStockOnly = false, role = 'Operations'): Promise<any> {
    const res = await fetch(`${this.baseUrl}/inventory?lowStockOnly=${lowStockOnly}`, {
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async getSalesReport(role = 'Admin'): Promise<any> {
    const res = await fetch(`${this.baseUrl}/reports/sales-revenue`, {
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  // ==========================================
  // NOTIFICATIONS API
  // ==========================================

  async getNotifications(
    page = 1,
    limit = 30,
    role = 'Operations'
  ): Promise<{
    success: boolean;
    data: any[];
    pagination?: { page: number; limit: number; totalCount: number; totalPages: number; unreadCount: number };
  }> {
    const res = await fetch(`${this.baseUrl}/notifications?page=${page}&limit=${limit}`, {
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async getUnreadNotificationsCount(role = 'Operations'): Promise<{ success: boolean; unreadCount: number }> {
    const res = await fetch(`${this.baseUrl}/notifications/unread-count`, {
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async markNotificationAsRead(id: string, role = 'Operations'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  async markAllNotificationsAsRead(role = 'Operations'): Promise<{ success: boolean; message: string; updatedCount: number }> {
    const res = await fetch(`${this.baseUrl}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(role)
    });
    return await res.json();
  }

  getNotificationStreamUrl(role = 'Operations'): string {
    return `${this.baseUrl}/notifications/stream?role=${encodeURIComponent(role)}`;
  }
}
