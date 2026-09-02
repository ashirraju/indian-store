import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppRole, UserProfile } from '../models/user.model';
import { Product, CartItem } from '../models/product.model';
import { Order, OrderStatus } from '../models/order.model';
import { MenuItem, BannerConfig, OfferItem } from '../models/cms.model';
import { Category } from '../models/category.model';
import { AppNotification } from '../models/notification.model';
import { ApiService } from './api.service';
import { AppKeycloakService } from './app-keycloak.service';
import { STORE_CONFIG, APP_ROUTES } from '../constants';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreStateService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly keycloak = inject(AppKeycloakService);

  private getBootRoleAndPath(): { role: AppRole; path: string } {
    if (typeof window === 'undefined') {
      return { role: AppRole.CUSTOMER, path: APP_ROUTES.STORE };
    }
    const hash = window.location.hash.replace(/^#/, '').split('?')[0];
    const path = hash || window.location.pathname || APP_ROUTES.STORE;

    if (path.startsWith(APP_ROUTES.ADMIN)) return { role: AppRole.ADMIN, path: APP_ROUTES.ADMIN };
    if (path.startsWith(APP_ROUTES.MANAGER)) return { role: AppRole.MANAGER, path: APP_ROUTES.MANAGER };
    if (path.startsWith(APP_ROUTES.OPERATIONS)) return { role: AppRole.OPERATIONS, path: APP_ROUTES.OPERATIONS };
    if (path.startsWith(APP_ROUTES.DELIVERY)) return { role: AppRole.DELIVERY, path: APP_ROUTES.DELIVERY };
    return { role: AppRole.CUSTOMER, path: APP_ROUTES.STORE };
  }

  // Active Role State
  readonly activeRole = signal<AppRole>(this.getBootRoleAndPath().role);
  readonly activePath = signal<string>(this.getBootRoleAndPath().path);
  readonly isCartOpen = signal<boolean>(false);
  readonly isWishlistOpen = signal<boolean>(false);
  readonly isOrdersModalOpen = signal<boolean>(false);
  readonly isCategoryPanelOpen = signal<boolean>(false);
  readonly activeDepartment = signal<string | null>(null);
  readonly selectedProductForModal = signal<Product | null>(null);
  readonly selectedOrderForTracking = signal<Order | null>(null);
  readonly apiCategories = signal<Category[]>([]);

  // Loading States for Skeletons
  readonly isLoadingCatalog = signal<boolean>(true);
  readonly isLoadingOrders = signal<boolean>(false);

  // Notifications State & Real-time Stream
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadNotificationsCount = computed(() => this.notifications().filter(n => !n.isRead).length);
  readonly isNotificationsDrawerOpen = signal<boolean>(false);

  readonly wishlist = signal<Product[]>([]);

  // Full-Text Search State
  readonly searchQuery = signal<string>('');
  readonly searchResults = signal<Product[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly totalSearchResults = signal<number>(0);

  constructor() {
    if (typeof window !== 'undefined') {
      const getInitialPath = () => {
        const hash = window.location.hash.replace(/^#/, '').split('?')[0];
        return hash || window.location.pathname || APP_ROUTES.STORE;
      };

      this.syncUrlPath(getInitialPath());

      window.addEventListener('popstate', () => {
        this.syncUrlPath(getInitialPath());
      });

      window.addEventListener('hashchange', () => {
        this.syncUrlPath(getInitialPath());
      });

      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const url = event.urlAfterRedirects || event.url;
          this.syncUrlPath(url);
        }
      });

      this.syncCatalogFromBackend();
      if (this.keycloak.isAuthenticated() || this.activeRole() !== 'Customer') {
        this.syncOrdersFromBackend();
      }
      this.syncNotifications();
      this.initNotificationStream();
    }
  }

  async syncCatalogFromBackend() {
    this.isLoadingCatalog.set(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        this.api.getCategories(),
        this.api.getProducts({ limit: 100 })
      ]);
      if (catsRes.success && catsRes.data?.length) {
        const sortedCats = [...catsRes.data].sort((a, b) => a.display_order - b.display_order);
        this.apiCategories.set(sortedCats);
        this.syncCategoriesToMenus(sortedCats);
      }
      if (prodsRes.success && prodsRes.data?.length) {
        const normalized = prodsRes.data.map(p => ({
          ...p,
          imageUrl: p.imageUrl || p.image_url || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
          image_url: p.image_url || p.imageUrl || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
          originalPrice: p.originalPrice || p.original_price,
          reviewsCount: p.reviewsCount || p.reviews_count || 0,
          isOrganic: p.isOrganic !== undefined ? p.isOrganic : p.is_organic,
          isBestseller: p.isBestseller !== undefined ? p.isBestseller : p.is_bestseller,
          originRegion: p.originRegion || p.origin_region || 'India'
        }));
        this.products.set(normalized);
      }
    } catch {
      // Offline fallback
    } finally {
      this.isLoadingCatalog.set(false);
    }
  }

  async syncOrdersFromBackend() {
    // If active role is Customer and user is not authenticated, do not call orders API
    if (this.activeRole() === 'Customer' && !this.keycloak.isAuthenticated()) {
      this.orders.set([]);
      this.isLoadingOrders.set(false);
      return;
    }

    this.isLoadingOrders.set(true);
    try {
      const res = await this.api.getOrders({ limit: 100 }, this.activeRole() || 'Admin');
      if (res.success && Array.isArray(res.data)) {
        const existingMap = new Map(this.orders().map(o => [o.id, o]));

        const mappedOrders: Order[] = res.data.map((o: any) => {
          const rawStatus = (o.status || '').toLowerCase().trim();
          let mappedStatus: OrderStatus = 'In Packing';
          if (rawStatus.includes('packed') || rawStatus.includes('dispatch') || rawStatus.includes('ready')) {
            mappedStatus = 'Packed';
          } else if (rawStatus.includes('delivery') || rawStatus.includes('transit') || rawStatus.includes('out')) {
            mappedStatus = 'Out for Delivery';
          } else if (rawStatus.includes('deliver') || rawStatus.includes('complete')) {
            mappedStatus = 'Delivered';
          } else if (rawStatus === 'cancelled') {
            mappedStatus = 'Cancelled' as OrderStatus;
          } else {
            mappedStatus = 'In Packing';
          }

          const existing = existingMap.get(o.id);
          let items = Array.isArray(o.items) && o.items.length > 0
            ? o.items.map((i: any) => ({
                product: {
                  id: i.productId || i.id || 'p-1',
                  name: i.name || 'Authentic Grocery Item',
                  category: i.category || 'Groceries',
                  price: parseFloat(i.unitPrice || i.price || '0'),
                  rating: 4.8,
                  reviewsCount: 50,
                  imageUrl: i.image || i.imageUrl || 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
                  description: '',
                  weight: i.weight || '1 unit',
                  stock: 50,
                  originRegion: 'India',
                  tags: []
                },
                quantity: i.quantity || 1
              }))
            : (existing?.items?.length ? existing.items : [
                {
                  product: {
                    id: 'p-item',
                    name: 'Assorted Indian Grocery Items',
                    category: 'Groceries',
                    price: parseFloat(o.total_amount || o.totalAmount || '0'),
                    rating: 4.9,
                    reviewsCount: 20,
                    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
                    description: '',
                    weight: 'Standard Order',
                    stock: 100,
                    originRegion: 'Australia',
                    tags: []
                  },
                  quantity: 1
                }
              ]);

          return {
            id: o.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            customerName: o.customer_name || o.customerName || existing?.customerName || 'Customer',
            customerEmail: o.customer_email || o.customerEmail || existing?.customerEmail || '',
            customerPhone: o.customer_phone || o.customerPhone || existing?.customerPhone || '',
            deliveryAddress: o.shipping_address?.addressLine || o.deliveryAddress || existing?.deliveryAddress || 'Delivery Address',
            city: o.shipping_address?.city || o.city || existing?.city || 'Sydney',
            state: o.shipping_address?.state || o.state || existing?.state || 'NSW',
            pincode: o.shipping_address?.pincode || o.pincode || existing?.pincode || '2000',
            postcode: o.shipping_address?.pincode || o.postcode || existing?.postcode || '2000',
            items,
            totalAmount: parseFloat(o.total_amount || o.totalAmount || existing?.totalAmount || '0'),
            paymentMethod: o.payment_method || o.paymentMethod || existing?.paymentMethod || 'Card',
            status: mappedStatus,
            placedAt: o.placed_at ? new Date(o.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today' : (existing?.placedAt || 'Today'),
            assignedDeliveryAgent: o.assigned_delivery_agent || o.assignedDeliveryAgent || existing?.assignedDeliveryAgent || 'Unassigned',
            deliveryNotes: o.delivery_notes || o.deliveryNotes || existing?.deliveryNotes || '',
            timeline: Array.isArray(o.timeline) && o.timeline.length > 0 ? o.timeline : [
              { status: 'In Packing', timestamp: 'Just now', completed: true, notes: 'Order confirmed & in packing queue' },
              { status: 'Packed', timestamp: 'Pending', completed: mappedStatus === 'Packed' || mappedStatus === 'Out for Delivery' || mappedStatus === 'Delivered' },
              { status: 'Out for Delivery', timestamp: 'Pending', completed: mappedStatus === 'Out for Delivery' || mappedStatus === 'Delivered' },
              { status: 'Delivered', timestamp: 'Pending', completed: mappedStatus === 'Delivered' }
            ]
          };
        });

        // Merge with any recent locally created orders not yet indexed
        const currentOrders = this.orders();
        const nonDuplicateLocals = currentOrders.filter(co => !mappedOrders.some(mo => mo.id === co.id));
        this.orders.set([...nonDuplicateLocals, ...mappedOrders]);
      }
    } catch (err) {
      console.warn('Backend orders sync:', err);
    } finally {
      this.isLoadingOrders.set(false);
    }
  }

  // ==========================================
  // SEARCH & AUTOCOMPLETE OPERATIONS
  // ==========================================

  async executeSearch(query: string, sort = 'relevance') {
    const trimmed = query.trim();
    this.searchQuery.set(trimmed);
    if (!trimmed) {
      this.searchResults.set([]);
      this.totalSearchResults.set(0);
      return;
    }

    this.isSearching.set(true);
    try {
      const res = await this.api.searchProducts({ q: trimmed, limit: 50, sort: sort as any });
      if (res.success && Array.isArray(res.data)) {
        const normalized = res.data.map(p => ({
          ...p,
          imageUrl: p.imageUrl || p.image_url || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
          image_url: p.image_url || p.imageUrl || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
          originalPrice: p.originalPrice || p.original_price,
          reviewsCount: p.reviewsCount || p.reviews_count || 0,
          isOrganic: p.isOrganic !== undefined ? p.isOrganic : p.is_organic,
          isBestseller: p.isBestseller !== undefined ? p.isBestseller : p.is_bestseller,
          originRegion: p.originRegion || p.origin_region || 'India'
        }));
        this.searchResults.set(normalized);
        this.totalSearchResults.set(res.totalCount || normalized.length);
      } else {
        this.searchResults.set([]);
        this.totalSearchResults.set(0);
      }
    } catch (err) {
      console.error('Search error:', err);
      this.searchResults.set([]);
      this.totalSearchResults.set(0);
    } finally {
      this.isSearching.set(false);
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.totalSearchResults.set(0);
  }

  syncCategoriesToMenus(categories: Category[]) {
    if (!categories || categories.length === 0) return;
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const customMenus = this.menus().filter(m => !m.path.startsWith('/category/'));
    const categoryMenus: MenuItem[] = sorted.map((cat, idx) => ({
      id: `m_${cat.id}`,
      label: cat.name,
      icon: cat.icon || 'grain',
      path: `/category/${cat.slug}`,
      visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'],
      order: cat.display_order || (idx + 1)
    }));
    this.menus.set([...categoryMenus, ...customMenus]);
  }

  updateCategoryOrder(newCategories: Category[]) {
    const sorted = [...newCategories].sort((a, b) => a.display_order - b.display_order);
    this.apiCategories.set(sorted);
    this.syncCategoriesToMenus(sorted);
  }

  syncUrlPath(path: string) {
    let targetRole: AppRole | null = null;
    if (path === '/admin' || path.startsWith('/admin')) targetRole = AppRole.ADMIN;
    else if (path === '/manager' || path.startsWith('/manager')) targetRole = AppRole.MANAGER;
    else if (path === '/operations' || path.startsWith('/operations')) targetRole = AppRole.OPERATIONS;
    else if (path === '/delivery' || path.startsWith('/delivery')) targetRole = AppRole.DELIVERY;

    if (targetRole) {
      if (this.keycloak.isInitialized() && !this.keycloak.isAuthenticated()) {
        const allowed = this.keycloak.requireAuthForRole(targetRole, path);
        if (!allowed) {
          return;
        }
      }
      this.activeRole.set(targetRole);
      this.activePath.set(path);
    } else {
      this.activeRole.set(AppRole.CUSTOMER);
      this.activePath.set(path === '/' ? APP_ROUTES.STORE : path);
    }
  }

  // User profiles per role
  readonly currentUser = computed<UserProfile>(() => {
    const role = this.activeRole();
    switch (role) {
      case 'Customer':
        return { id: 'u1', name: 'Aarav Sharma', email: 'aarav@example.com', role: 'Customer', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' };
      case 'Manager':
        return { id: 'u2', name: 'Priya Patel (Store Manager)', email: 'priya.manager@indianstore.com', role: 'Manager', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' };
      case 'Operations':
        return { id: 'u3', name: 'Rajesh Kumar (Warehouse Ops)', email: 'rajesh.ops@indianstore.com', role: 'Operations', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' };
      case 'Delivery':
        return { id: 'u4', name: 'Vikram Singh (Express Logistics)', email: 'vikram.delivery@indianstore.com', role: 'Delivery', avatarUrl: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=150&auto=format&fit=crop&q=80' };
      case 'Admin':
      default:
        return { id: 'u5', name: 'Devi Verma (Super Admin)', email: 'admin@indianstore.com', role: 'Admin', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' };
    }
  });

  // Dynamic Storefront Banner & Quick Info Configuration (AU Location & Currency)
  readonly bannerConfig = signal<BannerConfig>({
    announcementText: '🦘 Free Express Delivery across Australia on orders over $75 | Authentic Indian Groceries Delivered to Your Doorstep',
    announcementLink: '/page/diwali-special',
    quickInfoItems: [
      '🇦🇺 Australia-wide Express Dispatch',
      '🚚 Free Shipping Over $75',
      '🏷️ Extra 15% OFF Code: AUSSIE15',
      '🌿 100% Certified Organic & Fresh',
      '📞 Toll-Free Helpline: 1300 463 426'
    ],
    heroHeadline: 'Authentic Indian Groceries & Heritage Delivered Across Australia 🇦🇺',
    heroSubheadline: 'Directly sourced premium Basmati, whole spices, pure desi ghee, sweets & regional staples dispatched daily from our Sydney & Melbourne hubs.',
    heroBannerImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&auto=format&fit=crop&q=80',
    promoBadge: '✨ 100% Authentic Indian Products • Sourced Direct & Delivered in AU',
    primaryButtonText: 'Explore Collection'
  });

  // Dynamic Offers & Promotional Banners (AUD Currency)
  readonly offers = signal<OfferItem[]>([
    {
      id: 'off-1',
      badge: 'FESTIVE SPECIAL',
      title: 'Grand Festive Sweet & Royal Spice Hampers',
      code: 'DIWALI2026',
      discount: 'UP TO 30% OFF',
      bgColor: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      validTill: 'Limited Time Offer',
      image: 'https://images.unsplash.com/photo-1605826832916-d0ea9d6fe71e?w=500&auto=format&fit=crop&q=80',
      link: '/page/diwali-special'
    },
    {
      id: 'off-2',
      badge: 'FARM FRESH',
      title: 'Pure Kashmiri Mongra Saffron & Gourmet Spices Pack',
      code: 'SPICE15',
      discount: 'FLAT $15 OFF',
      bgColor: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      validTill: 'Valid Till Stock Lasts',
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
      link: '/store'
    },
    {
      id: 'off-3',
      badge: 'ARTISAN WEAVE',
      title: 'Varanasi Pure Katan Silk Handloom Sarees',
      code: 'SILK20',
      discount: 'FLAT 20% CASHBACK',
      bgColor: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      validTill: 'Artisan Clearance Sale',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80',
      link: '/page/handloom-story'
    }
  ]);

  // Dynamic Navigation Menus (Admin Customizable & Synced from Backend Categories)
  readonly menus = signal<MenuItem[]>([]);

  // Products Catalog (Fetched from Backend API)
  readonly products = signal<Product[]>([]);

  // Categories derived from Backend API
  readonly categories = computed<string[]>(() => {
    const apiCats = this.apiCategories();
    if (apiCats && apiCats.length > 0) {
      return ['All Categories', ...apiCats.map(c => c.name)];
    }
    const productCats = Array.from(
      new Set(this.products().map(p => p.category_name || p.category).filter((c): c is string => Boolean(c)))
    );
    if (productCats.length > 0) {
      return ['All Categories', ...productCats];
    }
    return ['All Categories'];
  });

  // Cart State
  readonly cart = signal<CartItem[]>([]);
  
  // Orders Catalog (Fetched from Backend API)
  readonly orders = signal<Order[]>([]);

  // Notifications / Toasts
  readonly toast = signal<ToastMessage | null>(null);
  readonly wishlistTotalCount = computed(() => this.wishlist().length);

  // Cart operations (Unique items count in cart)
  readonly cartTotalCount = computed(() => this.cart().length);
  readonly cartTotalUnits = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly cartSubtotal = computed(() =>
    Math.round(this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 100) / 100
  );

  addToCart(product: Product, quantity = 1) {
    this.playAddToCartSound();
    const existing = this.cart().find(item => item.product.id === product.id);
    if (existing) {
      this.cart.set(
        this.cart().map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      this.cart.set([...this.cart(), { product, quantity }]);
    }
    this.showToast('success', 'Added to Cart', `${product.name} (x${quantity}) added.`);
  }

  updateCartQuantity(productId: string, delta: number) {
    const item = this.cart().find(i => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.removeFromCart(productId);
    } else {
      this.cart.set(
        this.cart().map(i =>
          i.product.id === productId ? { ...i, quantity: newQty } : i
        )
      );
    }
  }

  getCartQuantity(productId: string): number {
    return this.cart().find(item => item.product.id === productId)?.quantity ?? 0;
  }

  removeFromCart(productId: string) {
    this.cart.set(this.cart().filter(item => item.product.id !== productId));
    this.showToast('info', 'Item Removed', 'Product removed from cart.');
  }

  clearCart() {
    this.cart.set([]);
  }

  // Checkout operation (AU Currency & Postcode with Backend Integration)
  async placeOrder(deliveryDetails: { name: string; email: string; phone: string; address: string; city: string; state?: string; pincode: string; postcode?: string; paymentMethod: string }): Promise<Order> {
    const isFreeShipping = this.cartSubtotal() >= STORE_CONFIG.FREE_SHIPPING_THRESHOLD;
    const shippingFee = isFreeShipping ? 0 : STORE_CONFIG.STANDARD_SHIPPING_FEE;
    const cartItems = [...this.cart()];

    const localOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: deliveryDetails.name,
      customerEmail: deliveryDetails.email,
      customerPhone: deliveryDetails.phone,
      deliveryAddress: deliveryDetails.address,
      city: deliveryDetails.city,
      state: deliveryDetails.state || STORE_CONFIG.DEFAULT_STATE,
      pincode: deliveryDetails.pincode || deliveryDetails.postcode || STORE_CONFIG.DEFAULT_POSTCODE,
      postcode: deliveryDetails.postcode || deliveryDetails.pincode || STORE_CONFIG.DEFAULT_POSTCODE,
      items: cartItems,
      totalAmount: Math.round((this.cartSubtotal() + shippingFee) * 100) / 100,
      paymentMethod: deliveryDetails.paymentMethod,
      status: 'In Packing',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      timeline: [
        { status: 'In Packing', timestamp: 'Just now', completed: true, notes: 'Order placed & sent to packing station' },
        { status: 'Packed', timestamp: 'Pending', completed: false },
        { status: 'Out for Delivery', timestamp: 'Pending', completed: false },
        { status: 'Delivered', timestamp: 'Pending', completed: false }
      ]
    };

    // Optimistic UI updates
    this.orders.set([localOrder, ...this.orders()]);
    this.clearCart();
    this.isCartOpen.set(false);
    this.showToast('success', 'Order Placed!', `Order ID #${localOrder.id} confirmed.`);

    // Instant local notification dispatch for Operations & Manager
    const localNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientRole: 'Operations',
      title: `🚨 New Order: #${localOrder.id}`,
      message: `Order #${localOrder.id} for $${localOrder.totalAmount} AUD (${localOrder.items.length} items) placed by ${localOrder.customerName}. Ready for fulfillment & packing.`,
      type: 'NEW_ORDER',
      referenceId: localOrder.id,
      metadata: {
        orderId: localOrder.id,
        customerName: localOrder.customerName,
        customerPhone: localOrder.customerPhone,
        totalAmount: localOrder.totalAmount,
        itemsCount: localOrder.items.length
      },
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.set([localNotif, ...this.notifications()]);

    // Backend Checkout API integration
    try {
      const apiPayload = {
        items: cartItems.map(i => ({
          productId: i.product.id,
          quantity: i.quantity
        })),
        shippingAddress: {
          fullName: deliveryDetails.name,
          phone: deliveryDetails.phone,
          email: deliveryDetails.email,
          addressLine: deliveryDetails.address,
          city: deliveryDetails.city,
          state: deliveryDetails.state || STORE_CONFIG.DEFAULT_STATE,
          pincode: deliveryDetails.pincode || deliveryDetails.postcode || STORE_CONFIG.DEFAULT_POSTCODE
        },
        paymentMethod: deliveryDetails.paymentMethod.includes('Card') ? 'Card' : deliveryDetails.paymentMethod.includes('COD') ? 'COD' : 'UPI'
      };

      const res = await this.api.checkoutOrder(apiPayload, 'Customer');
      if (res.success && res.data) {
        const backendOrder: Order = {
          ...localOrder,
          id: res.data.orderId || res.data.id || localOrder.id,
          totalAmount: res.data.totalAmount || localOrder.totalAmount
        };
        this.orders.set([backendOrder, ...this.orders().filter(o => o.id !== localOrder.id)]);
        this.syncCatalogFromBackend();
        this.syncNotifications();
        return backendOrder;
      }
    } catch (err) {
      console.warn('Backend order checkout fallback:', err);
    }

    return localOrder;
  }

  setRole(role: AppRole) {
    if (role !== 'Customer') {
      const allowed = this.keycloak.requireAuthForRole(role, `/${role.toLowerCase()}`);
      if (!allowed) {
        return;
      }
    }
    this.activeRole.set(role);
    this.showToast('info', `Switched Role to ${role}`, `You are now interacting as ${role}`);
    this.syncNotifications(role);
    this.initNotificationStream(role);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist().some(p => p.id === productId);
  }

  toggleWishlist(product: Product) {
    if (this.isInWishlist(product.id)) {
      this.wishlist.set(this.wishlist().filter(p => p.id !== product.id));
      this.showToast('info', 'Removed from Wishlist', `"${product.name}" was removed from your wishlist.`);
    } else {
      this.wishlist.set([...this.wishlist(), product]);
      this.showToast('success', 'Added to Wishlist ❤️', `"${product.name}" was saved to your wishlist.`);
    }
  }

  removeFromWishlist(productId: string) {
    const item = this.wishlist().find(p => p.id === productId);
    this.wishlist.set(this.wishlist().filter(p => p.id !== productId));
    if (item) {
      this.showToast('info', 'Wishlist Updated', `"${item.name}" was removed from your wishlist.`);
    }
  }

  moveToCartFromWishlist(product: Product) {
    this.addToCart(product, 1);
    this.removeFromWishlist(product.id);
  }

  openDepartment(deptName: string) {
    this.activeDepartment.set(deptName);
    this.navigateTo(APP_ROUTES.STORE);
  }

  closeDepartment() {
    this.activeDepartment.set(null);
  }

  navigateTo(path: string) {
    let targetRole: AppRole | null = null;
    if (path.startsWith(APP_ROUTES.ADMIN)) targetRole = 'Admin';
    else if (path.startsWith(APP_ROUTES.MANAGER)) targetRole = 'Manager';
    else if (path.startsWith(APP_ROUTES.OPERATIONS)) targetRole = 'Operations';
    else if (path.startsWith(APP_ROUTES.DELIVERY)) targetRole = 'Delivery';

    if (targetRole) {
      const allowed = this.keycloak.requireAuthForRole(targetRole, path);
      if (!allowed) {
        return;
      }
      this.activeRole.set(targetRole);
    } else if (path === APP_ROUTES.STORE || path.startsWith('/category/')) {
      this.activeRole.set('Customer');
    }

    this.syncUrlPath(path);
    this.router.navigateByUrl(path).catch(() => {
      if (typeof window !== 'undefined') {
        window.location.hash = '#' + path;
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showToast(type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) {
    this.toast.set({ id: Date.now().toString(), type, title, message });
    setTimeout(() => {
      this.toast.set(null);
    }, 4000);
  }

  playAddToCartSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Crisp double-chime (C6 -> E6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.07);
      gain2.gain.setValueAtTime(0.22, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.28);
    } catch {
      // Audio context fallback if audio block occurs
    }
  }

  // High-clarity warehouse new order alert chime (C5 -> G5 -> C6)
  playNewOrderAlertSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(523.25, now, 0.18);          // C5
      playTone(783.99, now + 0.12, 0.18);   // G5
      playTone(1046.50, now + 0.24, 0.35);  // C6
    } catch {
      // Audio block fallback
    }
  }

  // ==========================================
  // NOTIFICATIONS SYNC & REALTIME SSE STREAM
  // ==========================================

  async syncNotifications(role?: string) {
    const currentRole = role || this.activeRole() || 'Operations';
    try {
      const res = await this.api.getNotifications(1, 30, currentRole);
      if (res.success && Array.isArray(res.data)) {
        this.notifications.set(res.data);
      }
    } catch (err) {
      console.warn('Sync notifications fallback:', err);
    }
  }

  private sseSource: EventSource | null = null;

  initNotificationStream(role?: string) {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    const currentRole = role || this.activeRole() || 'Operations';

    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }

    try {
      const streamUrl = this.api.getNotificationStreamUrl(currentRole);
      this.sseSource = new EventSource(streamUrl);

      this.sseSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_ORDER' || payload.type === 'NOTIFICATION' || payload.title) {
            const notif: AppNotification = {
              id: payload.id || `notif_${Date.now()}`,
              recipientRole: payload.recipientRole || currentRole,
              title: payload.title || '🚨 New Order Received',
              message: payload.message || `New customer order has been placed.`,
              type: payload.type || 'NEW_ORDER',
              referenceId: payload.referenceId || payload.metadata?.orderId,
              metadata: payload.metadata,
              isRead: false,
              createdAt: payload.createdAt || new Date().toISOString()
            };

            // Prepend new notification
            this.notifications.set([notif, ...this.notifications().filter(n => n.id !== notif.id)]);

            // Audible and visual alert on Operations & Manager side
            this.playNewOrderAlertSound();
            this.showToast('warning', notif.title, notif.message);

            // Live refresh orders pipeline
            this.syncOrdersFromBackend();
          }
        } catch {
          // ignore non-json keep-alive messages
        }
      };

      this.sseSource.onerror = () => {
        // SSE reconnects automatically
      };
    } catch (err) {
      console.warn('SSE connection initialization fallback:', err);
    }
  }

  async markNotificationAsRead(id: string) {
    this.notifications.set(
      this.notifications().map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    try {
      await this.api.markNotificationAsRead(id, this.activeRole() || 'Operations');
    } catch (err) {
      console.warn('Mark notification as read fallback:', err);
    }
  }

  async markAllNotificationsAsRead() {
    this.notifications.set(
      this.notifications().map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    try {
      await this.api.markAllNotificationsAsRead(this.activeRole() || 'Operations');
      this.showToast('info', 'All Caught Up', 'All notifications marked as read.');
    } catch (err) {
      console.warn('Mark all notifications read fallback:', err);
    }
  }

  // Operations, Manager & Delivery Order Status Updates
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string, deliveryAgent?: string) {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stages: OrderStatus[] = ['In Packing', 'Packed', 'Ready for Dispatch', 'Out for Delivery', 'Delivered'];
    const targetIdx = stages.indexOf(newStatus);

    const updatedOrders = this.orders().map(order => {
      if (order.id === orderId) {
        const updatedTimeline = order.timeline.map(step => {
          const stepIdx = stages.indexOf(step.status);
          if (step.status === newStatus || (newStatus === 'Packed' && step.status === 'Ready for Dispatch')) {
            return { ...step, completed: true, timestamp: timeNow, notes: notes || step.notes || `Order ${newStatus}` };
          } else if (stepIdx !== -1 && targetIdx !== -1 && stepIdx < targetIdx) {
            return { ...step, completed: true, timestamp: step.timestamp === 'Pending' || step.timestamp === '--' ? timeNow : step.timestamp };
          }
          return step;
        });

        return {
          ...order,
          status: newStatus,
          assignedDeliveryAgent: deliveryAgent || order.assignedDeliveryAgent || 'Vikram Singh (Express)',
          deliveryNotes: notes || order.deliveryNotes,
          timeline: updatedTimeline
        };
      }
      return order;
    });

    this.orders.set(updatedOrders);
    this.showToast('success', 'Order Updated', `Order ${orderId} moved to ${newStatus}`);

    try {
      await this.api.updateOrderStatus(
        orderId,
        {
          status: newStatus.toString(),
          notes,
          assignedDeliveryAgent: deliveryAgent
        },
        this.activeRole() || 'Operations'
      );
    } catch (err) {
      console.warn('Backend order status update fallback:', err);
    }
  }

  // Admin CMS - Menu CRUD
  addMenuItem(item: Omit<MenuItem, 'id'>) {
    const newItem: MenuItem = { ...item, id: `m_${Date.now()}` };
    this.menus.set([...this.menus(), newItem]);
    this.showToast('success', 'Menu Added', `Navbar menu "${newItem.label}" created.`);
  }

  updateMenuItem(updatedItem: MenuItem) {
    this.menus.set(this.menus().map(m => m.id === updatedItem.id ? updatedItem : m));
    this.showToast('success', 'Menu Updated', `Menu "${updatedItem.label}" updated.`);
  }

  deleteMenuItem(id: string) {
    this.menus.set(this.menus().filter(m => m.id !== id));
    this.showToast('warning', 'Menu Deleted', 'Menu item removed from navigation.');
  }

  // Admin Store Banner Edit
  updateBannerConfig(config: BannerConfig) {
    this.bannerConfig.set(config);
    this.showToast('success', 'Storefront Updated', 'Hero banner and announcements live updated!');
  }

  // Manager Product CRUD
  saveProduct(productData: Partial<Product> & { id?: string }) {
    if (productData.id) {
      this.products.set(this.products().map(p => p.id === productData.id ? { ...p, ...productData } as Product : p));
      this.showToast('success', 'Product Updated', `${productData.name} updated successfully.`);
    } else {
      const newProd: Product = {
        id: `p-${Math.floor(100 + Math.random() * 900)}`,
        name: productData.name || 'New Product',
        category: productData.category || 'Spices & Seasonings',
        price: productData.price || 299,
        originalPrice: productData.originalPrice || 399,
        rating: 5.0,
        reviewsCount: 1,
        imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        description: productData.description || 'Authentic product sourced directly from local producers.',
        weight: productData.weight || '250g',
        stock: productData.stock || 50,
        isOrganic: productData.isOrganic || false,
        isBestseller: productData.isBestseller || false,
        originRegion: productData.originRegion || 'India',
        tags: productData.tags || ['Authentic']
      };
      this.products.set([newProd, ...this.products()]);
      this.showToast('success', 'Product Created', `${newProd.name} added to inventory.`);
    }
  }

  deleteProduct(id: string) {
    this.products.set(this.products().filter(p => p.id !== id));
    this.showToast('warning', 'Product Deleted', 'Item removed from catalog.');
  }
}
