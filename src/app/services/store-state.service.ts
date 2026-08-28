import { Injectable, signal, computed } from '@angular/core';
import { AppRole, UserProfile } from '../models/user.model';
import { Product, CartItem } from '../models/product.model';
import { Order, OrderStatus } from '../models/order.model';
import { MenuItem, CustomPage, BannerConfig, OfferItem } from '../models/cms.model';
import { DynamicFormSchema, FormSubmission } from '../models/dynamic-form.model';

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
  // Active Role State
  readonly activeRole = signal<AppRole>('Customer');
  readonly activePath = signal<string>('/store');
  readonly isCartOpen = signal<boolean>(false);
  readonly isWishlistOpen = signal<boolean>(false);
  readonly isOrdersModalOpen = signal<boolean>(false);
  readonly selectedProductForModal = signal<Product | null>(null);
  readonly selectedOrderForTracking = signal<Order | null>(null);
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
      this.syncUrlPath(window.location.pathname);
      window.addEventListener('popstate', () => {
        this.syncUrlPath(window.location.pathname);
      });
    }
  }

  syncUrlPath(path: string) {
    if (path === '/admin') {
      this.activeRole.set('Admin');
      this.activePath.set('/admin');
    } else if (path === '/manager') {
      this.activeRole.set('Manager');
      this.activePath.set('/manager');
    } else if (path === '/operations') {
      this.activeRole.set('Operations');
      this.activePath.set('/operations');
    } else if (path === '/delivery') {
      this.activeRole.set('Delivery');
      this.activePath.set('/delivery');
    } else {
      this.activeRole.set('Customer');
      this.activePath.set(path === '/' ? '/store' : path);
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

  // Dynamic Storefront Banner & Quick Info Configuration
  readonly bannerConfig = signal<BannerConfig>({
    announcementText: '🚀 Festive Special: Free express shipping across India on orders above ₹999!',
    announcementLink: '/page/diwali-special',
    quickInfoItems: [
      '⚡ Express 24-Hour Dispatch',
      '🚚 Free Shipping Above ₹999',
      '🏷️ Extra 15% OFF Code: FESTIVE15',
      '🌱 100% Certified Organic',
      '📞 Toll Free Helpline: 1800-425-4634'
    ],
    heroHeadline: 'Authentic Indian Flavors & Handcrafted Elegance',
    heroSubheadline: 'Directly sourced from organic spice farms of Kerala, weavers of Varanasi, and master sweet artisans of Bengal.',
    heroBannerImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&auto=format&fit=crop&q=80',
    promoBadge: '✨ 100% Sourced Direct From Farmers & Artisans',
    primaryButtonText: 'Explore Collection'
  });

  // Dynamic Offers & Promotional Banners
  readonly offers = signal<OfferItem[]>([
    {
      id: 'off-1',
      badge: 'FESTIVE SPECIAL',
      title: 'Grand Diwali Sweet & Spice Hampers',
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
      title: 'Pure Kashmiri Mongra Saffron & Spices Pack',
      code: 'SPICE15',
      discount: 'FLAT ₹250 OFF',
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
    { id: 'm1', label: 'Store Catalog', icon: 'storefront', path: '/store', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 1 },
    { id: 'm2', label: 'Flours & Dals', icon: 'rice_bowl', path: '/store', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 2 },
    { id: 'm3', label: 'Spices & Seasonings', icon: 'spa', path: '/store', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 3 },
    { id: 'm4', label: 'Festive & Sweets', icon: 'auto_awesome', path: '/page/diwali-special', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 4, badge: 'HOT' },
    { id: 'm5', label: 'Wholesale Request', icon: 'inventory_2', path: '/form/bulk-wholesale', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 5 },
    { id: 'm6', label: 'Feedback & Support', icon: 'support_agent', path: '/form/customer-feedback', visibleRoles: ['Customer', 'Manager', 'Operations', 'Delivery', 'Admin'], order: 6 }
  ]);

  // Dynamic Custom Pages (Admin Customizable!)
  readonly customPages = signal<CustomPage[]>([
    {
      id: 'p1',
      slug: 'diwali-special',
      title: 'Grand Festive & Diwali Gift Hampers',
      subtitle: 'Handpicked organic dry fruits, pure saffron, artisanal brass diyas, and authentic Bengali sweets.',
      bannerImage: 'https://images.unsplash.com/photo-1605826832916-d0ea9d6fe71e?w=1000&auto=format&fit=crop&q=80',
      content: `
        <h3>Brighten Your Celebrations with Pure Heritage</h3>
        <p>Every festive box is crafted with passion. Our signature hampers feature GI-tagged Kashmiri Saffron, organic A2 Ghee sweets, and hand-cast Brass Lakshmi Diyas made by artisans in Uttar Pradesh.</p>
        <br/>
        <h4>What's inside our Royal Festive Collection?</h4>
        <ul>
          <li><strong>Kashmiri Mongra Saffron (A++ Grade)</strong> - 5 grams in wooden gift box</li>
          <li><strong>Artisanal Kaju Katli & Dry Fruit Ladoo</strong> - 500g freshly made</li>
          <li><strong>Hand-Carved Brass Diya Set</strong> - Set of 4 with pure cotton wicks</li>
          <li><strong>Assorted Single-Origin Darjeeling First Flush Tea</strong> - 100g tins</li>
        </ul>
      `,
      ctaText: 'Shop Festive Gift Boxes',
      ctaLink: '/store',
      isPublished: true,
      createdAt: '2026-08-01'
    },
    {
      id: 'p2',
      slug: 'handloom-story',
      title: 'Woven Legacies: Banarasi & Kanjeevaram Handlooms',
      subtitle: 'Preserving India’s 500-year-old weaving traditions with direct artisan fair-trade partnerships.',
      bannerImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80',
      content: `
        <h3>Direct From Master Weavers of Varanasi & Kanchipuram</h3>
        <p>We work directly with weaver cooperatives to bring you authentic silk textiles without middleman markups. Each saree takes over 140 hours of manual craftsmanship on traditional wooden pit looms.</p>
        <p>Every purchase ensures ethical wages and keeps ancient handloom arts thriving for future generations.</p>
      `,
      ctaText: 'Browse Handloom Sarees',
      ctaLink: '/store',
      isPublished: true,
      createdAt: '2026-08-10'
    }
  ]);

  // Dynamic Custom Forms (Admin Customizable!)
  readonly customForms = signal<DynamicFormSchema[]>([
    {
      id: 'f1',
      slug: 'bulk-wholesale',
      title: 'Bulk & Corporate Wholesale Request',
      description: 'Request customized corporate gift boxes, restaurant spice supplies, or export quantities with tier discounts.',
      submitButtonText: 'Submit Wholesale Request',
      isPublished: true,
      fields: [
        { id: 'f1_1', label: 'Company / Organization Name', name: 'companyName', type: 'text', placeholder: 'e.g. Spice Route Bistro', required: true },
        { id: 'f1_2', label: 'Contact Email Address', name: 'email', type: 'email', placeholder: 'contact@yourcompany.com', required: true },
        { id: 'f1_3', label: 'Product Category Required', name: 'category', type: 'select', options: ['Organic Spices in Bulk', 'Festive Gift Hampers', 'Traditional Tea & Coffee', 'Custom Handloom Gifting'], required: true },
        { id: 'f1_4', label: 'Estimated Order Quantity (KG or Units)', name: 'quantity', type: 'number', placeholder: 'e.g. 100', required: true },
        { id: 'f1_5', label: 'Special Instructions / Requirements', name: 'notes', type: 'textarea', placeholder: 'Specify custom branding, packaging preferences, or delivery timeline...', required: false }
      ]
    },
    {
      id: 'f2',
      slug: 'customer-feedback',
      title: 'Customer Feedback & Product Suggestion',
      description: 'We love hearing from our community! Share your experience or request new regional items.',
      submitButtonText: 'Send Feedback',
      isPublished: true,
      fields: [
        { id: 'f2_1', label: 'Your Full Name', name: 'fullName', type: 'text', placeholder: 'e.g. Ananya Roy', required: true },
        { id: 'f2_2', label: 'Email Address', name: 'email', type: 'email', placeholder: 'ananya@example.com', required: true },
        { id: 'f2_3', label: 'Overall Shopping Experience', name: 'rating', type: 'select', options: ['⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐⭐ Average', '⭐⭐ Needs Improvement'], required: true },
        { id: 'f2_4', label: 'Your Comments & Suggestions', name: 'comments', type: 'textarea', placeholder: 'Tell us what you liked or how we can serve you better...', required: true }
      ]
    }
  ]);

  // Submissions for Dynamic Forms
  readonly formSubmissions = signal<FormSubmission[]>([
    {
      id: 'sub_1',
      formId: 'f1',
      formTitle: 'Bulk & Corporate Wholesale Request',
      submittedAt: '2026-08-27 14:30',
      data: { companyName: 'Royal Spice House NYC', email: 'orders@royalspice.com', category: 'Organic Spices in Bulk', quantity: '250', notes: 'Need vacuum packed 5kg sacks of Malabar Black Pepper.' }
    }
  ]);

  // Initial Hardcoded Products (Inspired by Tales of India Catalog)
  readonly products = signal<Product[]>([
    // 1. Flours, Rice & Dals
    {
      id: 'p-101',
      name: 'India Gate Nur Jahan Biryani Basmati Rice (5kg)',
      category: 'Flours, Rice & Dals',
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
      id: 'p-102',
      name: 'Grewal Chakki Whole Wheat Atta (5kg)',
      category: 'Flours, Rice & Dals',
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
      id: 'p-103',
      name: 'Pattu Premium Unpolished Yellow Toor Dal (1kg)',
      category: 'Flours, Rice & Dals',
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

    // 2. Spices & Seasonings
    {
      id: 'p-104',
      name: 'Pure Kashmiri Mongra Saffron / Kesar (2g)',
      category: 'Spices & Seasonings',
      price: 1299,
      originalPrice: 1599,
      rating: 5.0,
      reviewsCount: 210,
      imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
      description: 'GI-Tagged Grade A++ All-Red Kashmiri Mongra Saffron stigmas. Intense aroma and rich golden crimson color.',
      weight: '2g Glass Vial',
      stock: 45,
      isOrganic: true,
      isBestseller: true,
      originRegion: 'Pampore, Kashmir',
      tags: ['GI Tagged', 'Kesar', 'Saffron']
    },
    {
      id: 'p-105',
      name: 'Organic Malabar Whole Black Pepper (250g)',
      category: 'Spices & Seasonings',
      price: 499,
      originalPrice: 650,
      rating: 4.9,
      reviewsCount: 142,
      imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
      description: 'Sun-dried high-piprine whole black peppercorns harvested from high elevation estates of Wayanad.',
      weight: '250g Pack',
      stock: 85,
      isOrganic: true,
      isBestseller: false,
      originRegion: 'Wayanad, Kerala',
      tags: ['Black Pepper', 'Spices']
    },
    {
      id: 'p-106',
      name: 'Mother’s Recipe Shahi Garam Masala (100g)',
      category: 'Spices & Seasonings',
      price: 119,
      originalPrice: 140,
      rating: 4.8,
      reviewsCount: 78,
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      description: 'A aromatic blend of 15 royal spices including mace, nutmeg, cardamom, and cinnamon.',
      weight: '100g Box',
      stock: 110,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'India',
      tags: ['Garam Masala', 'Blend']
    },

    // 3. Sweets & Snacks
    {
      id: 'p-107',
      name: 'Haldiram’s White Rasbhari Sweets (1kg Tin)',
      category: 'Sweets & Snacks',
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
      category: 'Sweets & Snacks',
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

    // 4. Dairy, Frozen & Instant
    {
      id: 'p-109',
      name: 'Nanak Pure Desi Cow Ghee (800g Jar)',
      category: 'Dairy, Frozen & Instant',
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
      id: 'p-110',
      name: 'HOI Instant Veg Darjeeling Momos (350g)',
      category: 'Dairy, Frozen & Instant',
      price: 249,
      originalPrice: 299,
      rating: 4.6,
      reviewsCount: 88,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
      description: 'Authentic Himalayan style steamed vegetable dumplings with spicy red garlic dip included.',
      weight: '350g Pack (12 Pcs)',
      stock: 40,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'Darjeeling, India',
      tags: ['Momos', 'Frozen']
    },
    {
      id: 'p-111',
      name: 'Gits Instant Gota & Pakora Mix (500g)',
      category: 'Dairy, Frozen & Instant',
      price: 149,
      originalPrice: 175,
      rating: 4.8,
      reviewsCount: 94,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      description: 'Ready-to-cook spiced chickpea flour fritter mix for crispy hot evening snacks.',
      weight: '500g Box',
      stock: 80,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'India',
      tags: ['Gits', 'Instant Mix']
    },

    // 5. Beverages & Teas
    {
      id: 'p-112',
      name: 'Wagh Bakri Premium CTC Tea Bags (100 Bags)',
      category: 'Beverages & Teas',
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
      category: 'Beverages & Teas',
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

    // 6. Pickles, Chutneys & Sauces
    {
      id: 'p-114',
      name: 'Pachranga Tenti Delha Pickle in Oil (800g Jar)',
      category: 'Pickles, Chutneys & Sauces',
      price: 249,
      originalPrice: 290,
      rating: 4.7,
      reviewsCount: 115,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      description: 'Traditional North Indian wild berry pickle seasoned with mustard oil and aromatic spices.',
      weight: '800g Glass Jar',
      stock: 50,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'Panipat, Haryana',
      tags: ['Pachranga', 'Pickle', 'Achar']
    },
    {
      id: 'p-115',
      name: 'Katoomba Tangy Tomato Chutney (295ml)',
      category: 'Pickles, Chutneys & Sauces',
      price: 179,
      originalPrice: 210,
      rating: 4.8,
      reviewsCount: 72,
      imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
      description: 'Homestyle sweet and spicy tomato relish perfect with samosas, parathas, or snacks.',
      weight: '295ml Glass Bottle',
      stock: 85,
      isOrganic: false,
      isBestseller: false,
      originRegion: 'India',
      tags: ['Chutney', 'Katoomba']
    },

    // 7. Puja & Personal Care
    {
      id: 'p-116',
      name: 'Handcrafted Brass Lakshmi Pooja Thali Set',
      category: 'Puja & Personal Care',
      price: 899,
      originalPrice: 1200,
      rating: 5.0,
      reviewsCount: 68,
      imageUrl: 'https://images.unsplash.com/photo-1605826832916-d0ea9d6fe71e?w=600&auto=format&fit=crop&q=80',
      description: 'Solid brass embossed prayer plate complete with brass diya, bell, roli bowl, and agarbatti stand.',
      weight: 'Plate Set (8 Inch)',
      stock: 30,
      isOrganic: false,
      isBestseller: true,
      originRegion: 'Moradabad, UP',
      tags: ['Pooja Thali', 'Brass', 'Festive']
    }
  ]);

  // Categories derived or specified
  readonly categories = computed<string[]>(() => [
    'All Categories',
    'Flours, Rice & Dals',
    'Spices & Seasonings',
    'Sweets & Snacks',
    'Dairy, Frozen & Instant',
    'Beverages & Teas',
    'Pickles, Chutneys & Sauces',
    'Puja & Personal Care'
  ]);

  // Cart State
  readonly cart = signal<CartItem[]>([]);
  readonly cartTotalCount = computed<number>(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly cartSubtotal = computed<number>(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  // Orders State
  readonly orders = signal<Order[]>([
    {
      id: 'ORD-9821',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav@example.com',
      customerPhone: '+91 98765 43210',
      deliveryAddress: 'Flat 402, Lotus Heights, MG Road',
      city: 'Bengaluru',
      pincode: '560001',
      items: [
        {
          product: {
            id: 'p-101',
            name: 'Organic Malabar Black Whole Pepper',
            category: 'Spices & Seasonings',
            price: 499,
            rating: 4.9,
            reviewsCount: 142,
            imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
            description: 'Sun-dried black pepper',
            weight: '250g Pack',
            stock: 85,
            originRegion: 'Kerala',
            tags: ['Spices']
          },
          quantity: 2
        },
        {
          product: {
            id: 'p-103',
            name: 'Pure Desi Cow Ghee (A2 Bilona Method)',
            category: 'Dairy & Ghee',
            price: 950,
            rating: 4.8,
            reviewsCount: 215,
            imageUrl: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=600&auto=format&fit=crop&q=80',
            description: 'Bilona churning method',
            weight: '500ml Glass Jar',
            stock: 62,
            originRegion: 'Gujarat',
            tags: ['Ghee']
          },
          quantity: 1
        }
      ],
      totalAmount: 1948,
      paymentMethod: 'UPI Direct (Google Pay)',
      status: 'Out for Delivery',
      placedAt: '2026-08-28 10:15 AM',
      assignedDeliveryAgent: 'Vikram Singh (Express Logistics)',
      deliveryNotes: 'Leave near security gate if customer unavailable',
      timeline: [
        { status: 'Placed', timestamp: '10:15 AM', completed: true, notes: 'Order placed successfully' },
        { status: 'In Packing', timestamp: '10:45 AM', completed: true, notes: 'Packed at Central Warehouse' },
        { status: 'Ready for Dispatch', timestamp: '11:30 AM', completed: true, notes: 'Handed over to delivery agent' },
        { status: 'Out for Delivery', timestamp: '01:20 PM', completed: true, notes: 'Delivery agent Vikram en route' },
        { status: 'Delivered', timestamp: 'Expected 3:30 PM', completed: false }
      ]
    },
    {
      id: 'ORD-9822',
      customerName: 'Meera Iyer',
      customerEmail: 'meera.iyer@example.com',
      customerPhone: '+91 91234 56789',
      deliveryAddress: 'No. 12, Besant Avenue, Adyar',
      city: 'Chennai',
      pincode: '600020',
      items: [
        {
          product: {
            id: 'p-102',
            name: 'Pure Kashmiri Mongra Saffron (Kesar)',
            category: 'Spices & Seasonings',
            price: 1299,
            rating: 5.0,
            reviewsCount: 98,
            imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
            description: 'Kashmiri Mongra Saffron',
            weight: '2g',
            stock: 40,
            originRegion: 'Kashmir',
            tags: ['Kesar']
          },
          quantity: 1
        }
      ],
      totalAmount: 1299,
      paymentMethod: 'Credit Card',
      status: 'In Packing',
      placedAt: '2026-08-28 12:40 PM',
      assignedDeliveryAgent: 'Unassigned',
      timeline: [
        { status: 'Placed', timestamp: '12:40 PM', completed: true },
        { status: 'In Packing', timestamp: '01:10 PM', completed: true, notes: 'Packing with protective bubble wrap' },
        { status: 'Ready for Dispatch', timestamp: '--', completed: false },
        { status: 'Out for Delivery', timestamp: '--', completed: false },
        { status: 'Delivered', timestamp: '--', completed: false }
      ]
    }
  ]);

  // Notifications / Toasts
  readonly toast = signal<ToastMessage | null>(null);
  readonly wishlistTotalCount = computed(() => this.wishlist().length);

  // Actions
  setRole(role: AppRole) {
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

  navigateTo(path: string) {
    this.syncUrlPath(path);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showToast(type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) {
    this.toast.set({ id: Date.now().toString(), type, title, message });
    setTimeout(() => {
      this.toast.set(null);
    }, 4000);
  }

  // Cart operations
  addToCart(product: Product, quantity = 1) {
    const current = this.cart();
    const existingIndex = current.findIndex(i => i.product.id === product.id);

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex].quantity += quantity;
      this.cart.set(updated);
    } else {
      this.cart.set([...current, { product, quantity }]);
    }

    this.showToast('success', 'Added to Cart', `${product.name} (x${quantity}) added.`);
  }

  updateCartQuantity(productId: string, delta: number) {
    const current = this.cart();
    const updated = current
      .map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter((item): item is CartItem => item !== null);

    this.cart.set(updated);
  }

  removeFromCart(productId: string) {
    this.cart.set(this.cart().filter(item => item.product.id !== productId));
    this.showToast('info', 'Item Removed', 'Product removed from cart.');
  }

  clearCart() {
    this.cart.set([]);
  }

  // Checkout operation
  placeOrder(deliveryDetails: { name: string; email: string; phone: string; address: string; city: string; pincode: string; paymentMethod: string }): Order {
    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: deliveryDetails.name,
      customerEmail: deliveryDetails.email,
      customerPhone: deliveryDetails.phone,
      deliveryAddress: deliveryDetails.address,
      city: deliveryDetails.city,
      pincode: deliveryDetails.pincode,
      items: [...this.cart()],
      totalAmount: this.cartSubtotal() + (this.cartSubtotal() > 999 ? 0 : 99),
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

    this.orders.set([newOrder, ...this.orders()]);
    this.clearCart();
    this.isCartOpen.set(false);
    this.showToast('success', 'Order Placed!', `Order ID #${newOrder.id} confirmed.`);
    return newOrder;
  }

  // Operations & Delivery Order Status Updates
  updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string, deliveryAgent?: string) {
    const updatedOrders = this.orders().map(order => {
      if (order.id === orderId) {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Admin CMS - Custom Page CRUD
  saveCustomPage(page: Omit<CustomPage, 'id' | 'createdAt'> & { id?: string }) {
    if (page.id) {
      this.customPages.set(this.customPages().map(p => p.id === page.id ? { ...p, ...page } as CustomPage : p));
      this.showToast('success', 'Page Saved', `Page "${page.title}" updated.`);
    } else {
      const newPage: CustomPage = {
        ...page,
        id: `p_${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.customPages.set([...this.customPages(), newPage]);
      this.showToast('success', 'Page Created', `Page "${newPage.title}" created.`);
    }
  }

  deleteCustomPage(id: string) {
    this.customPages.set(this.customPages().filter(p => p.id !== id));
    this.showToast('warning', 'Page Deleted', 'Custom page removed.');
  }

  // Admin CMS - Dynamic Form CRUD
  saveDynamicForm(form: Omit<DynamicFormSchema, 'id'> & { id?: string }) {
    if (form.id) {
      this.customForms.set(this.customForms().map(f => f.id === form.id ? { ...f, ...form } as DynamicFormSchema : f));
      this.showToast('success', 'Form Saved', `Form "${form.title}" updated.`);
    } else {
      const newForm: DynamicFormSchema = {
        ...form,
        id: `f_${Date.now()}`
      };
      this.customForms.set([...this.customForms(), newForm]);
      this.showToast('success', 'Form Created', `Form "${newForm.title}" published.`);
    }
  }

  deleteDynamicForm(id: string) {
    this.customForms.set(this.customForms().filter(f => f.id !== id));
    this.showToast('warning', 'Form Deleted', 'Dynamic form removed.');
  }

  // Submit Dynamic Form response
  submitForm(formId: string, formTitle: string, formData: Record<string, any>) {
    const submission: FormSubmission = {
      id: `sub_${Date.now()}`,
      formId,
      formTitle,
      submittedAt: new Date().toLocaleString(),
      data: formData
    };
    this.formSubmissions.set([submission, ...this.formSubmissions()]);
    this.showToast('success', 'Response Submitted!', 'Thank you for your submission.');
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
