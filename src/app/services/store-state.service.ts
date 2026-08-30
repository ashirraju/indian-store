import { Injectable, signal, computed, inject } from '@angular/core';
import { AppRole, UserProfile } from '../models/user.model';
import { Product, CartItem } from '../models/product.model';
import { Order, OrderStatus } from '../models/order.model';
import { MenuItem, BannerConfig, OfferItem } from '../models/cms.model';
import { Category } from '../models/category.model';
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

  readonly wishlist = signal<Product[]>([
    {
      id: 'p-102',
      name: 'Pure Kashmiri Mongra Saffron (Kesar)',
      category: 'Spices & Seasonings',
      price: 1299,
      originalPrice: 1599,
      rating: 5.0,
      reviewsCount: 98,
      imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
      description: 'Grade A++ All-Red Kashmiri Mongra Saffron threads.',
      weight: '2g Pack',
      stock: 45,
      originRegion: 'Pampore, Kashmir',
      tags: ['Kesar', 'Spices'],
      isBestseller: true,
      isOrganic: true
    }
  ]);

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

      this.syncCatalogFromBackend();
      this.syncOrdersFromBackend();
    }
  }

  async syncCatalogFromBackend() {
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
    }
  }

  async syncOrdersFromBackend() {
    try {
      const res = await this.api.getOrders({ limit: 100 }, this.activeRole() || 'Admin');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mappedOrders: Order[] = res.data.map((o: any) => ({
          id: o.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: o.customer_name || o.customerName || 'Customer',
          customerEmail: o.customer_email || o.customerEmail || '',
          customerPhone: o.customer_phone || o.customerPhone || '',
          deliveryAddress: o.shipping_address?.addressLine || o.deliveryAddress || 'Delivery Address',
          city: o.shipping_address?.city || o.city || 'Sydney',
          state: o.shipping_address?.state || o.state || 'NSW',
          pincode: o.shipping_address?.pincode || o.pincode || '2000',
          postcode: o.shipping_address?.pincode || o.postcode || '2000',
          items: Array.isArray(o.items) ? o.items.map((i: any) => ({
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
          })) : [],
          totalAmount: parseFloat(o.total_amount || o.totalAmount || '0'),
          paymentMethod: o.payment_method || o.paymentMethod || 'Card',
          status: (o.status as OrderStatus) || 'Placed',
          placedAt: o.placed_at ? new Date(o.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today' : 'Today',
          assignedDeliveryAgent: o.assigned_delivery_agent || o.assignedDeliveryAgent || 'Unassigned',
          deliveryNotes: o.delivery_notes || o.deliveryNotes || '',
          timeline: Array.isArray(o.timeline) && o.timeline.length > 0 ? o.timeline : [
            { status: 'Placed', timestamp: 'Just now', completed: true, notes: 'Order confirmed' },
            { status: 'In Packing', timestamp: 'Pending', completed: o.status === 'In Packing' || o.status === 'Ready for Dispatch' || o.status === 'Out for Delivery' || o.status === 'Delivered' },
            { status: 'Ready for Dispatch', timestamp: 'Pending', completed: o.status === 'Ready for Dispatch' || o.status === 'Out for Delivery' || o.status === 'Delivered' },
            { status: 'Out for Delivery', timestamp: 'Pending', completed: o.status === 'Out for Delivery' || o.status === 'Delivered' },
            { status: 'Delivered', timestamp: 'Pending', completed: o.status === 'Delivered' }
          ]
        }));
        this.orders.set(mappedOrders);
      }
    } catch (err) {
      console.warn('Backend orders sync:', err);
    }
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

  // Dynamic Navigation Menus (Admin Customizable!)
  readonly menus = signal<MenuItem[]>([
    { id: 'm1', label: 'Atta, rice & grains', icon: 'grain', path: '/category/atta-rice-grains', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 1 },
    { id: 'm2', label: 'Dal & pulses', icon: 'rice_bowl', path: '/category/dal-pulses', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 2 },
    { id: 'm3', label: 'Oil & ghee', icon: 'opacity', path: '/category/oil-ghee', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 3 },
    { id: 'm4', label: 'Tea & coffee', icon: 'coffee', path: '/category/tea-coffee', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 4 },
    { id: 'm5', label: 'Chips & biscuits', icon: 'cookie', path: '/category/chips-biscuits', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 5 },
    { id: 'm6', label: 'Bath & body', icon: 'soap', path: '/category/bath-body', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 6 },
    { id: 'm7', label: 'Make up & cosmetics', icon: 'face_retouching_natural', path: '/category/make-up-cosmetics', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 7 },
    { id: 'm8', label: 'Laundry detergents', icon: 'local_laundry_service', path: '/category/laundry-detergents', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 8 },
    { id: 'm9', label: 'Baby care', icon: 'child_care', path: '/category/baby-care', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 9 },
    { id: 'm10', label: 'Pet care', icon: 'pets', path: '/category/pet-care', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 10 }
  ]);

  // Initial Hardcoded Products (Inspired by Amazon Fresh & Tales of India Catalog)
  readonly products = signal<Product[]>([
    // 1. Atta, rice & grains
    {
      id: 'p-101a',
      name: 'India Gate Nur Jahan Biryani Basmati Rice (5kg)',
      category: 'Atta, rice & grains',
      price: 999,
      originalPrice: 1200,
      rating: 4.9,
      reviewsCount: 184,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
      description: 'Extra long grain premium biryani basmati rice with exquisite aroma and fluffy non-sticky texture.',
      weight: '5kg Bag',
      stock: 65,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'Punjab, India',
      tags: ['Basmati Rice', 'Biryani', 'Pantry']
    },
    {
      id: 'p-101b',
      name: 'Daawat Rozana Gold Basmati Rice (5kg)',
      category: 'Atta, rice & grains',
      price: 549,
      originalPrice: 650,
      rating: 4.7,
      reviewsCount: 132,
      imageUrl: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&auto=format&fit=crop&q=80',
      description: 'Daily cooking long grain aromatic basmati rice for home-cooked meals.',
      weight: '5kg Pack',
      stock: 75,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'Haryana, India',
      tags: ['Basmati Rice', 'Daawat']
    },
    {
      id: 'p-101c',
      name: 'Aashirvaad Superior MP Sharbati Atta (10kg)',
      category: 'Atta, rice & grains',
      price: 799,
      originalPrice: 899,
      rating: 4.9,
      reviewsCount: 340,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      description: '100% pure Sharbati wheat grains from the fertile fields of Sehore Madhya Pradesh.',
      weight: '10kg Bag',
      stock: 110,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'Madhya Pradesh, India',
      tags: ['Sharbati Atta', 'Aashirvaad']
    },
    {
      id: 'p-101d',
      name: 'Fortune Chakki Fresh Whole Wheat Atta (5kg)',
      category: 'Atta, rice & grains',
      price: 399,
      originalPrice: 460,
      rating: 4.8,
      reviewsCount: 95,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      description: 'Traditional stone-ground flour retaining natural dietary fiber and whole grain nutrients.',
      weight: '5kg Pack',
      stock: 85,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'Gujarat, India',
      tags: ['Chakki Atta', 'Fortune']
    },
    {
      id: 'p-101e',
      name: 'Organic Tattva Certified Brown Basmati Rice (1kg)',
      category: 'Atta, rice & grains',
      price: 180,
      originalPrice: 220,
      rating: 4.6,
      reviewsCount: 78,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
      description: 'Nutrient-rich unpolished brown basmati rice high in fiber and low glycemic index.',
      weight: '1kg Pouch',
      stock: 60,
      isOrganic: true,
      isBestseller: false,
      originRegion: 'Uttarakhand, India',
      tags: ['Brown Rice', 'Organic']
    },
    {
      id: 'p-101f',
      name: 'Pillsbury Multi-Grain Atta with 7 Grains (5kg)',
      category: 'Atta, rice & grains',
      price: 499,
      originalPrice: 580,
      rating: 4.8,
      reviewsCount: 210,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      description: 'Wholesome blend of wheat, soy, oats, maize, ragi, chana dal, and barley for wholesome rotis.',
      weight: '5kg Pack',
      stock: 90,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'India',
      tags: ['Multigrain', 'Pillsbury']
    },
    {
      id: 'p-101g',
      name: 'Royal Heritage Idli & Dosa Rice (5kg)',
      category: 'Atta, rice & grains',
      price: 420,
      originalPrice: 499,
      rating: 4.7,
      reviewsCount: 115,
      imageUrl: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&auto=format&fit=crop&q=80',
      description: 'Short grain parboiled rice ideal for making soft, fluffy idlis and crisp golden dosas.',
      weight: '5kg Bag',
      stock: 80,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'Tamil Nadu, India',
      tags: ['Idli Rice', 'South Indian']
    },
    {
      id: 'p-101h',
      name: 'Tata Sampann High Protein Organic Poha (500g)',
      category: 'Atta, rice & grains',
      price: 75,
      originalPrice: 90,
      rating: 4.9,
      reviewsCount: 160,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
      description: 'Thick beaten rice flakes from organic rice paddy, source of natural dietary iron.',
      weight: '500g Pack',
      stock: 120,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'Maharashtra, India',
      tags: ['Poha', 'Tata Sampann']
    },
    {
      id: 'p-102',
      name: 'Grewal Chakki Whole Wheat Atta (5kg)',
      category: 'Atta, rice & grains',
      price: 449,
      originalPrice: 520,
      rating: 4.8,
      reviewsCount: 142,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      description: '100% pure stone-ground chakki wheat flour for soft, fluffy rotis and parathas.',
      weight: '5kg Pack',
      stock: 90,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'Madhya Pradesh, India',
      tags: ['Chakki Atta', 'Wheat Flour']
    },
    {
      id: 'p-103b',
      name: 'The Rice Company Sona Masoori Rice (5kg)',
      category: 'Atta, rice & grains',
      price: 649,
      originalPrice: 750,
      rating: 4.8,
      reviewsCount: 110,
      imageUrl: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&auto=format&fit=crop&q=80',
      description: 'Aromatic, lightweight medium-grain white rice popular across South Indian households.',
      weight: '5kg Bag',
      stock: 80,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'Andhra Pradesh, India',
      tags: ['Sona Masoori', 'Rice']
    },
    {
      id: 'p-103c',
      name: 'Organic Tattva Coarse Wheat Suji Rava (500g)',
      category: 'Atta, rice & grains',
      price: 65,
      originalPrice: 80,
      rating: 4.8,
      reviewsCount: 94,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      description: 'Unbleached natural semolina / rava made from selected durum wheat grains for upma and halwa.',
      weight: '500g Pack',
      stock: 95,
      isOrganic: true,
      isBestseller: false,
      originRegion: 'Rajasthan, India',
      tags: ['Suji', 'Rava', 'Millet & other flours']
    },
    {
      id: 'p-103d-millet',
      name: 'Pure Desi Bajra & Jowar Millet Flour (1kg)',
      category: 'Atta, rice & grains',
      price: 139,
      originalPrice: 165,
      rating: 4.9,
      reviewsCount: 128,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      description: 'Gluten-free traditional pearl millet flour rich in dietary iron, magnesium, and dietary fiber.',
      weight: '1kg Bag',
      stock: 70,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'Gujarat, India',
      tags: ['Millet', 'Jowar', 'Bajra', 'Millet & other flours']
    },

    // 2. Dal & pulses
    {
      id: 'p-103',
      name: 'Pattu Premium Unpolished Yellow Toor Dal (1kg)',
      category: 'Dal & pulses',
      price: 189,
      originalPrice: 220,
      rating: 4.7,
      reviewsCount: 96,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      description: 'High-protein unpolished yellow pigeon peas (arhar dal) sourced from natural organic farms.',
      weight: '1kg Pack',
      stock: 120,
      isOrganic: true,
      isBestseller: false,
      originRegion: 'Maharashtra, India',
      tags: ['Toor Dal', 'Unpolished']
    },
    {
      id: 'p-103d',
      name: 'Organic Chana Dal Unpolished (1kg)',
      category: 'Dal & pulses',
      price: 169,
      originalPrice: 199,
      rating: 4.9,
      reviewsCount: 88,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      description: 'Nutritious unpolished split Bengal gram packed with dietary fiber and essential minerals.',
      weight: '1kg Pack',
      stock: 105,
      isOrganic: true,
      isBestseller: false,
      originRegion: 'Rajasthan, India',
      tags: ['Chana Dal', 'Organic']
    },

    // 3. Oil & ghee
    {
      id: 'p-109',
      name: 'Nanak Pure Desi Cow Ghee (800g Jar)',
      category: 'Oil & ghee',
      price: 799,
      originalPrice: 950,
      rating: 4.9,
      reviewsCount: 310,
      imageUrl: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=600&auto=format&fit=crop&q=80',
      description: '100% pure clarified cow butter ghee with rich golden color and aromatic traditional flavor.',
      weight: '800g Glass Jar',
      stock: 60,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'India',
      tags: ['Desi Ghee', 'Nanak', 'Dairy']
    },
    {
      id: 'p-103f',
      name: 'Fortune Cold Pressed Mustard Oil (1L)',
      category: 'Oil & ghee',
      price: 219,
      originalPrice: 260,
      rating: 4.8,
      reviewsCount: 160,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
      description: 'Pungent cold-pressed kachi ghani mustard oil for authentic Indian cooking.',
      weight: '1 Liter Bottle',
      stock: 130,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'Haryana, India',
      tags: ['Mustard Oil', 'Cooking Oil']
    },

    // 4. Tea & coffee
    {
      id: 'p-112',
      name: 'Wagh Bakri Premium CTC Tea Bags (100 Bags)',
      category: 'Tea & coffee',
      price: 349,
      originalPrice: 420,
      rating: 4.9,
      reviewsCount: 275,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      description: 'Strong, rich Assam black tea blend famous for its deep amber color and energizing taste.',
      weight: '100 Tea Bags Box',
      stock: 100,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'Assam, India',
      tags: ['Wagh Bakri', 'Chai', 'Tea']
    },
    {
      id: 'p-113',
      name: 'Girnar Detox Green Tea Tulsi (36 Bags)',
      category: 'Tea & coffee',
      price: 299,
      originalPrice: 350,
      rating: 4.8,
      reviewsCount: 120,
      imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80',
      description: 'Infused with holy basil (tulsi), ginger, and rock salt for soothing immunity boost.',
      weight: '36 Filter Bags Box',
      stock: 65,
      isOrganic: true,
      isBestseller: false,
      originRegion: 'Gujarat, India',
      tags: ['Girnar', 'Green Tea', 'Tulsi']
    },
    {
      id: 'p-113e',
      name: 'Bru Instant Coffee Powder Jar (200g)',
      category: 'Tea & coffee',
      price: 389,
      originalPrice: 450,
      rating: 4.8,
      reviewsCount: 190,
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
      description: '70% coffee & 30% chicory blend roasted for aromatic South Indian filter coffee flavor.',
      weight: '200g Glass Jar',
      stock: 110,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'South India',
      tags: ['Bru', 'Coffee']
    },

    // 5. Chips & biscuits
    {
      id: 'p-107',
      name: 'Haldiram’s White Rasbhari Sweets (1kg Tin)',
      category: 'Chips & biscuits',
      price: 399,
      originalPrice: 480,
      rating: 4.9,
      reviewsCount: 230,
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
      description: 'Juicy, soft mini rasgullas soaked in cardamom-infused light sugar syrup.',
      weight: '1kg Sealed Tin',
      stock: 55,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'Nagpur, India',
      tags: ['Haldiram', 'Sweets', 'Rasbhari']
    },
    {
      id: 'p-108',
      name: 'Amul Jiralu Masala Ghee Khakhra (200g)',
      category: 'Chips & biscuits',
      price: 99,
      originalPrice: 120,
      rating: 4.7,
      reviewsCount: 64,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
      description: 'Traditional Gujarati whole wheat crisp thin bread roasted with cow ghee and spicy jiralu seasoning.',
      weight: '200g Pack',
      stock: 75,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'Gujarat, India',
      tags: ['Amul', 'Khakhra', 'Snacks']
    },
    {
      id: 'p-108f',
      name: 'Balaji Classic Salted Potato Wafers (150g)',
      category: 'Chips & biscuits',
      price: 60,
      originalPrice: 75,
      rating: 4.8,
      reviewsCount: 95,
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
      description: 'Thin, crispy salted potato chips cooked in pure refined vegetable oil.',
      weight: '150g Bag',
      stock: 120,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'Gujarat, India',
      tags: ['Chips', 'Wafers']
    },

    // 6. Bath & body
    {
      id: 'p-116c',
      name: 'Patanjali Kesh Kanti Milk Protein Shampoo (180ml)',
      category: 'Bath & body',
      price: 129,
      originalPrice: 150,
      rating: 4.8,
      reviewsCount: 220,
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
      description: 'Ayurvedic hair cleanser enriched with bhringraj, aloe vera, and natural milk proteins.',
      weight: '180ml Bottle',
      stock: 95,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'Haridwar, India',
      tags: ['Patanjali', 'Ayurvedic']
    },
    {
      id: 'p-116d',
      name: 'Vatika Coconut Enriched Hair Oil (200ml)',
      category: 'Bath & body',
      price: 169,
      originalPrice: 199,
      rating: 4.8,
      reviewsCount: 150,
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
      description: 'Pure coconut hair oil fortified with henna, amla, lemon, and 7 ayurvedic herbs.',
      weight: '200ml Bottle',
      stock: 80,
      isOrganic: true,
      isBestseller: false,
      originRegion: 'India',
      tags: ['Vatika', 'Hair Oil']
    },

    // 7. Make up & cosmetics
    {
      id: 'p-701',
      name: 'Lakmé Absolute Skin Natural Mousse (25g)',
      category: 'Make up & cosmetics',
      price: 750,
      originalPrice: 850,
      rating: 4.9,
      reviewsCount: 180,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      description: 'Feather-light SPF 8 formula that hides pores and provides 16-hour flawless matte finish.',
      weight: '25g Pack',
      stock: 60,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'India',
      tags: ['Lakme', 'Cosmetics']
    },
    {
      id: 'p-702',
      name: 'Sugar Cosmetics Matte As Hell Lip Crayon (2.8g)',
      category: 'Make up & cosmetics',
      price: 799,
      originalPrice: 899,
      rating: 4.8,
      reviewsCount: 140,
      imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
      description: 'High-pigment creamy matte lipstick crayon that stays put without drying lips.',
      weight: '2.8g Stick',
      stock: 75,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'India',
      tags: ['Sugar', 'Lipstick']
    },

    // 8. Laundry detergents
    {
      id: 'p-801',
      name: 'Surf Excel Easy Wash Detergent Powder (1kg)',
      category: 'Laundry detergents',
      price: 145,
      originalPrice: 165,
      rating: 4.9,
      reviewsCount: 310,
      imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&auto=format&fit=crop&q=80',
      description: 'Superior stain removal technology that dissolves tough oil and dirt stains effortlessly.',
      weight: '1kg Pack',
      stock: 150,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'India',
      tags: ['Surf Excel', 'Laundry']
    },
    {
      id: 'p-802',
      name: 'Ariel Matic Top Load Washing Powder (2kg)',
      category: 'Laundry detergents',
      price: 490,
      originalPrice: 550,
      rating: 4.8,
      reviewsCount: 240,
      imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&auto=format&fit=crop&q=80',
      description: 'Enzyme-enriched laundry detergent formula designed specifically for top load washing machines.',
      weight: '2kg Bag',
      stock: 90,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'India',
      tags: ['Ariel', 'Detergent']
    },

    // 9. Baby care
    {
      id: 'p-901',
      name: 'Himalaya Gentle Baby Shampoo (200ml)',
      category: 'Baby care',
      price: 175,
      originalPrice: 199,
      rating: 4.9,
      reviewsCount: 290,
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
      description: 'No-tears mild baby shampoo infused with hibiscus and chickpea protein extracts.',
      weight: '200ml Bottle',
      stock: 110,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'India',
      tags: ['Baby Shampoo', 'Himalaya']
    },
    {
      id: 'p-902',
      name: 'Pampers All Round Protection Baby Diapers (48 Pcs)',
      category: 'Baby care',
      price: 799,
      originalPrice: 950,
      rating: 4.8,
      reviewsCount: 420,
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
      description: 'Ultra-absorbent breathable diaper pants with aloe vera lotion for leakproof overnight protection.',
      weight: '48 Pcs Pack (Medium)',
      stock: 80,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'India',
      tags: ['Diapers', 'Pampers']
    },

    // 10. Pet care
    {
      id: 'p-1001',
      name: 'Pedigree Adult Dry Dog Food Chicken & Veg (3kg)',
      category: 'Pet care',
      price: 720,
      originalPrice: 820,
      rating: 4.8,
      reviewsCount: 190,
      imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80',
      description: 'Balanced nutrition with omega 6 & zinc for healthy skin, shiny coat, and strong immunity.',
      weight: '3kg Bag',
      stock: 70,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'India',
      tags: ['Pedigree', 'Dog Food']
    },
    {
      id: 'p-1002',
      name: 'Whiskas Ocean Fish Adult Dry Cat Food (1.2kg)',
      category: 'Pet care',
      price: 440,
      originalPrice: 499,
      rating: 4.7,
      reviewsCount: 130,
      imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80',
      description: 'Crunchy kibble filled with delicious real fish protein, taurine, and vitamin E.',
      weight: '1.2kg Bag',
      stock: 65,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'India',
      tags: ['Whiskas', 'Cat Food']
    }
  ]);

  // Categories derived or specified
  readonly categories = computed<string[]>(() => {
    const apiCats = this.apiCategories();
    if (apiCats && apiCats.length > 0) {
      return ['All Categories', ...apiCats.map(c => c.name)];
    }
    return [
      'All Categories',
      'Atta, rice & grains',
      'Dal & pulses',
      'Oil & ghee',
      'Tea & coffee',
      'Chips & biscuits',
      'Bath & body',
      'Make up & cosmetics',
      'Laundry detergents',
      'Baby care',
      'Pet care'
    ];
  });

  // Cart State
  readonly cart = signal<CartItem[]>([]);
  
  // Sample Mock Initial Orders (Australian Locations: Sydney, Melbourne)
  readonly orders = signal<Order[]>([
    {
      id: 'ORD-9821',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav.sharma@example.com.au',
      customerPhone: '+61 412 345 678',
      deliveryAddress: '24 George Street, The Rocks',
      city: 'Sydney',
      state: 'NSW',
      pincode: '2000',
      postcode: '2000',
      items: [
        {
          product: {
            id: 'p-101',
            name: 'Organic Malabar Black Whole Pepper',
            category: 'Spices & Seasonings',
            price: 14.99,
            rating: 4.9,
            reviewsCount: 142,
            imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
            description: 'Sun-dried black pepper imported from Malabar',
            weight: '250g Pack',
            stock: 85,
            originRegion: 'Kerala, India',
            tags: ['Spices']
          },
          quantity: 2
        },
        {
          product: {
            id: 'p-103',
            name: 'Pure Desi Cow Ghee (A2 Bilona Method)',
            category: 'Oil & ghee',
            price: 24.50,
            rating: 4.8,
            reviewsCount: 215,
            imageUrl: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=600&auto=format&fit=crop&q=80',
            description: 'Traditional A2 bilona churning method',
            weight: '500ml Glass Jar',
            stock: 62,
            originRegion: 'Gujarat, India',
            tags: ['Ghee']
          },
          quantity: 1
        }
      ],
      totalAmount: 54.48,
      paymentMethod: 'Credit Card (Mastercard / Visa)',
      status: 'Out for Delivery',
      placedAt: '2026-08-28 10:15 AM',
      assignedDeliveryAgent: 'David Miller (Express AU Logistics)',
      deliveryNotes: 'Leave at front porch if unattended',
      timeline: [
        { status: 'Placed', timestamp: '10:15 AM', completed: true, notes: 'Order placed by customer' },
        { status: 'In Packing', timestamp: '10:45 AM', completed: true, notes: 'Packed at Sydney Distribution Centre' },
        { status: 'Ready for Dispatch', timestamp: '11:30 AM', completed: true, notes: 'Handed over to AU express courier' },
        { status: 'Out for Delivery', timestamp: '01:20 PM', completed: true, notes: 'Courier driver David on delivery route' },
        { status: 'Delivered', timestamp: 'Expected 3:30 PM', completed: false }
      ]
    },
    {
      id: 'ORD-9822',
      customerName: 'Meera Iyer',
      customerEmail: 'meera.iyer@example.com.au',
      customerPhone: '+61 423 456 789',
      deliveryAddress: '108 Collins Street',
      city: 'Melbourne',
      state: 'VIC',
      pincode: '3000',
      postcode: '3000',
      items: [
        {
          product: {
            id: 'p-102',
            name: 'Pure Kashmiri Mongra Saffron (Kesar)',
            category: 'Spices & Seasonings',
            price: 29.99,
            rating: 5.0,
            reviewsCount: 98,
            imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
            description: 'Grade-A Kashmiri Mongra Saffron',
            weight: '2g Box',
            stock: 40,
            originRegion: 'Kashmir, India',
            tags: ['Kesar']
          },
          quantity: 1
        }
      ],
      totalAmount: 39.98,
      paymentMethod: 'Apple Pay / PayPal',
      status: 'In Packing',
      placedAt: '2026-08-28 12:40 PM',
      assignedDeliveryAgent: 'Unassigned',
      timeline: [
        { status: 'Placed', timestamp: '12:40 PM', completed: true },
        { status: 'In Packing', timestamp: '01:10 PM', completed: true, notes: 'Packing with temperature-safe wrap' },
        { status: 'Ready for Dispatch', timestamp: '--', completed: false },
        { status: 'Out for Delivery', timestamp: '--', completed: false },
        { status: 'Delivered', timestamp: '--', completed: false }
      ]
    }
  ]);

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
      status: 'Placed',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      timeline: [
        { status: 'Placed', timestamp: 'Just now', completed: true, notes: 'Order placed by customer' },
        { status: 'In Packing', timestamp: 'Pending', completed: false },
        { status: 'Ready for Dispatch', timestamp: 'Pending', completed: false },
        { status: 'Out for Delivery', timestamp: 'Pending', completed: false },
        { status: 'Delivered', timestamp: 'Pending', completed: false }
      ]
    };

    // Optimistic UI updates
    this.orders.set([localOrder, ...this.orders()]);
    this.clearCart();
    this.isCartOpen.set(false);
    this.showToast('success', 'Order Placed!', `Order ID #${localOrder.id} confirmed.`);

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
    if (typeof window !== 'undefined') {
      window.location.hash = '#' + path;
    }
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

  // Operations & Delivery Order Status Updates
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string, deliveryAgent?: string) {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedOrders = this.orders().map(order => {
      if (order.id === orderId) {
        const updatedTimeline = order.timeline.map(step => {
          if (step.status === newStatus) {
            return { ...step, completed: true, timestamp: timeNow, notes: notes || step.notes };
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
