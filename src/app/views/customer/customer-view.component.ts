import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { ApiService } from '../../services/api.service';
import { Product } from '../../models/product.model';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-view.component.html',
  styleUrl: './customer-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerViewComponent implements OnInit {
  readonly Math = Math;
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);

  readonly selectedProduct = signal<Product | null>(null);
  readonly selectedOrder = signal<Order | null>(null);
  readonly isLoadingProducts = signal<boolean>(false);

  readonly categoryListWithoutAll = computed(() =>
    this.store.categories().filter(c => c !== 'All Categories')
  );

  async ngOnInit() {
    await this.loadStoreProducts();
  }

  readonly fallbackImage = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80';

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.fallbackImage) {
      img.src = this.fallbackImage;
    }
  }

  async loadStoreProducts() {
    this.isLoadingProducts.set(true);
    try {
      const res = await this.api.getProducts({ limit: 100 });
      if (res.success && res.data && res.data.length > 0) {
        const normalized = res.data.map(p => ({
          ...p,
          imageUrl: p.imageUrl || p.image_url || this.fallbackImage,
          image_url: p.image_url || p.imageUrl || this.fallbackImage,
          originalPrice: p.originalPrice || p.original_price,
          reviewsCount: p.reviewsCount || p.reviews_count || 0,
          isOrganic: p.isOrganic !== undefined ? p.isOrganic : p.is_organic,
          isBestseller: p.isBestseller !== undefined ? p.isBestseller : p.is_bestseller,
          originRegion: p.originRegion || p.origin_region || 'India'
        }));
        this.store.products.set(normalized);
      }
    } catch (err) {
      console.error('Error fetching live products in customer view:', err);
    } finally {
      this.isLoadingProducts.set(false);
    }
  }

  async openProductDetail(product: Product) {
    const prodWithImg: Product = {
      ...product,
      imageUrl: product.imageUrl || product.image_url || this.fallbackImage,
      image_url: product.image_url || product.imageUrl || this.fallbackImage
    };
    this.selectedProduct.set(prodWithImg);
    try {
      const res = await this.api.getProduct(product.id);
      if (res.success && res.data) {
        const updated: Product = {
          ...res.data,
          imageUrl: res.data.imageUrl || res.data.image_url || this.fallbackImage,
          image_url: res.data.image_url || res.data.imageUrl || this.fallbackImage,
          originalPrice: res.data.originalPrice || res.data.original_price,
          reviewsCount: res.data.reviewsCount || res.data.reviews_count || 0,
          isOrganic: res.data.isOrganic !== undefined ? res.data.isOrganic : res.data.is_organic,
          isBestseller: res.data.isBestseller !== undefined ? res.data.isBestseller : res.data.is_bestseller
        };
        this.selectedProduct.set(updated);
      }
    } catch {
      // Keep optimistic product
    }
  }

  getCategoryIcon(catName: string): string {
    const found = this.store.apiCategories().find(c => c.name === catName);
    if (found?.icon) return found.icon;
    switch (catName) {
      case 'Atta, rice & grains': return 'grain';
      case 'Dal & pulses': return 'rice_bowl';
      case 'Oil & ghee': return 'opacity';
      case 'Tea & coffee': return 'coffee';
      case 'Chips & biscuits': return 'cookie';
      case 'Bath & body': return 'soap';
      case 'Make up & cosmetics': return 'face_retouching_natural';
      case 'Laundry detergents': return 'local_laundry_service';
      case 'Baby care': return 'child_care';
      case 'Pet care': return 'pets';
      default: return 'storefront';
    }
  }

  getProductsByCategory(categoryName: string): Product[] {
    const targetCat = this.store.apiCategories().find(
      c => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName || c.slug === this.slugify(categoryName)
    );
    return this.store.products().filter(p => {
      if (targetCat) {
        if (
          p.category === targetCat.id ||
          p.category === targetCat.name ||
          p.category_name === targetCat.name ||
          p.category_slug === targetCat.slug
        ) {
          return true;
        }
      }
      const lower = categoryName.toLowerCase();
      return (
        p.category?.toLowerCase() === lower ||
        p.category_name?.toLowerCase() === lower ||
        p.category_slug?.toLowerCase() === this.slugify(categoryName)
      );
    });
  }

  slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  readonly activeDepartment = signal<string | null>(null);
  readonly activeSubMenu = signal<string>('All');
  readonly departmentSortBy = signal<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');

  readonly departmentSubMenus: Record<string, string[]> = {
    'Atta, rice & grains': [
      'All',
      'Supersaver',
      'Atta & flours',
      'Rice',
      'Whole grains',
      'Poha',
      'Millet & other flours',
      'Organic'
    ],
    'Dal & pulses': [
      'All',
      'Supersaver',
      'Toor & Arhar Dal',
      'Moong Dal',
      'Chana Dal',
      'Urad & Rajma',
      'Organic'
    ],
    'Oil & ghee': [
      'All',
      'Supersaver',
      'Pure Desi Ghee',
      'Mustard Oil',
      'Sunflower Oil',
      'Cold Pressed',
      'Organic'
    ],
    'Tea & coffee': [
      'All',
      'Supersaver',
      'CTC Tea',
      'Green Tea',
      'Filter Coffee',
      'Instant Coffee',
      'Organic'
    ],
    'Chips & biscuits': [
      'All',
      'Supersaver',
      'Traditional Snacks',
      'Potato Chips',
      'Khakhra & Namkeen',
      'Biscuits & Cookies',
      'Sweets'
    ],
    'Bath & body': [
      'All',
      'Supersaver',
      'Soaps & Bodywash',
      'Shampoos',
      'Hair Oils',
      'Ayurvedic Skincare'
    ],
    'Make up & cosmetics': [
      'All',
      'Supersaver',
      'Lipstick & Lip Care',
      'Face & Foundation',
      'Eye Makeup',
      'Skin Toners & Serums'
    ],
    'Laundry detergents': [
      'All',
      'Supersaver',
      'Liquid Detergents',
      'Detergent Powders',
      'Fabric Conditioners',
      'Stain Removers'
    ],
    'Baby care': [
      'All',
      'Supersaver',
      'Diapers & Wipes',
      'Baby Shampoo & Wash',
      'Baby Creams & Lotions',
      'Organic'
    ],
    'Pet care': [
      'All',
      'Supersaver',
      'Dog Food',
      'Cat Food',
      'Pet Treats',
      'Grooming & Shampoos'
    ]
  };

  async openDepartmentView(categoryName: string) {
    this.store.activeDepartment.set(categoryName);
    this.activeSubMenu.set('All');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const targetCat = this.store.apiCategories().find(
      c => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName || c.slug === this.slugify(categoryName)
    );
    try {
      const res = await this.api.getProducts({
        category: targetCat?.id || categoryName,
        limit: 100
      });
      if (res.success && res.data?.length) {
        const existing = this.store.products();
        const updatedMap = new Map(existing.map(p => [p.id, p]));
        res.data.forEach(p => updatedMap.set(p.id, p));
        this.store.products.set(Array.from(updatedMap.values()));
      }
    } catch (err) {
      console.error('Error fetching live category products:', err);
    }
  }

  async onDepartmentSortChange(sortOption: 'popular' | 'price-low' | 'price-high' | 'rating') {
    this.departmentSortBy.set(sortOption);
    const dept = this.store.activeDepartment();
    if (!dept) return;

    const targetCat = this.store.apiCategories().find(
      c => c.name.toLowerCase() === dept.toLowerCase() || c.id === dept
    );
    let apiSort: any = '';
    if (sortOption === 'price-low') apiSort = 'price-low';
    else if (sortOption === 'price-high') apiSort = 'price-high';
    else if (sortOption === 'rating') apiSort = 'rating';

    try {
      const res = await this.api.getProducts({
        category: targetCat?.id || dept,
        sort: apiSort,
        limit: 100
      });
      if (res.success && res.data?.length) {
        const existing = this.store.products();
        const updatedMap = new Map(existing.map(p => [p.id, p]));
        res.data.forEach(p => updatedMap.set(p.id, p));
        this.store.products.set(Array.from(updatedMap.values()));
      }
    } catch (err) {
      console.error('Error sorting department products:', err);
    }
  }

  closeDepartmentView() {
    this.store.activeDepartment.set(null);
    this.activeSubMenu.set('All');
  }

  getSubMenusForCategory(catName: string): string[] {
    const apiCat = this.store.apiCategories().find(
      c => c.name.toLowerCase() === catName.toLowerCase() || c.id === catName || c.slug === catName
    );
    if (apiCat?.sub_categories && apiCat.sub_categories.length > 0) {
      const dynamicSubs = apiCat.sub_categories
        .sort((a, b) => a.display_order - b.display_order)
        .map(s => s.name);
      return ['All', 'Supersaver', ...dynamicSubs, 'Organic'];
    }
    return this.departmentSubMenus[catName] || ['All', 'Supersaver', 'Organic'];
  }

  getSubSectionsForDepartment(categoryName: string): string[] {
    const allSubs = this.getSubMenusForCategory(categoryName);
    const active = this.activeSubMenu();
    if (active && active !== 'All') {
      return allSubs.filter(s => s === active);
    }
    return allSubs.filter(s => s !== 'All');
  }

  getProductsBySubSection(categoryName: string, subSectionName: string): Product[] {
    const list = this.getProductsByCategory(categoryName);
    const lower = subSectionName.toLowerCase();

    let filtered: Product[] = [];
    if (lower === 'supersaver') {
      filtered = list.filter(p => (p.originalPrice && p.originalPrice > p.price) || (p.discount_percent && p.discount_percent > 0) || p.isBestseller);
    } else if (lower === 'organic') {
      filtered = list.filter(p => p.isOrganic || p.name.toLowerCase().includes('organic'));
    } else {
      const apiCat = this.store.apiCategories().find(
        c => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName || c.slug === categoryName
      );
      const subObj = apiCat?.sub_categories?.find(
        s => s.name.toLowerCase() === lower || s.slug === lower.replace(/[^a-z0-9]+/g, '-')
      );

      filtered = list.filter(p => {
        const pSub = (p.subCategory || p.sub_category || '').toLowerCase();
        const pSubName = (p.sub_category_name || '').toLowerCase();
        const pSubSlug = (p.sub_category_slug || '').toLowerCase();
        const pName = p.name.toLowerCase();
        const pTags = (p.tags || []).map(t => t.toLowerCase());

        if (subObj) {
          if (p.sub_category === subObj.id || p.subCategory === subObj.id) return true;
          if (pSubName === subObj.name.toLowerCase() || pSubSlug === subObj.slug.toLowerCase()) return true;
        }

        return (
          pSub === lower ||
          pSubName === lower ||
          pSubSlug === lower.replace(/[^a-z0-9]+/g, '-') ||
          pName.includes(lower) ||
          pTags.some(t => t.includes(lower)) ||
          p.description.toLowerCase().includes(lower)
        );
      });
    }

    const sort = this.departmentSortBy();
    if (sort === 'price-low') {
      return [...filtered].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      return [...filtered].sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    }
    return [...filtered].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  }

  scrollToSubSection(subName: string) {
    this.activeSubMenu.set(subName);
    if (subName === 'All') {
      return;
    }
    setTimeout(() => {
      const id = 'sub-section-' + this.slugify(subName);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  scrollToCategories() {
    const el = document.getElementById('categories-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  readonly scrollState = signal<Record<string, { canScrollLeft: boolean; canScrollRight: boolean }>>({});

  onCarouselScroll(slug: string, event: Event) {
    const el = event.target as HTMLElement;
    if (!el) return;
    this.updateScrollState(slug, el);
  }

  updateScrollState(slug: string, el: HTMLElement) {
    const canScrollLeft = el.scrollLeft > 10;
    const canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 15);
    this.scrollState.update(state => ({
      ...state,
      [slug]: { canScrollLeft, canScrollRight }
    }));
  }

  canScrollLeft(slug: string): boolean {
    return this.scrollState()[slug]?.canScrollLeft ?? false;
  }

  canScrollRight(slug: string, itemsCount: number): boolean {
    const s = this.scrollState()[slug];
    if (s !== undefined) {
      return s.canScrollRight;
    }
    return itemsCount > 3;
  }

  scrollToCategorySection(catName: string) {
    const id = 'cat-section-' + this.slugify(catName);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollCategoryLeft(carouselId: string, slug: string) {
    const el = document.getElementById(carouselId);
    if (el) {
      el.scrollBy({ left: -360, behavior: 'smooth' });
      setTimeout(() => this.updateScrollState(slug, el), 350);
    }
  }

  scrollCategoryRight(carouselId: string, slug: string) {
    const el = document.getElementById(carouselId);
    if (el) {
      el.scrollBy({ left: 360, behavior: 'smooth' });
      setTimeout(() => this.updateScrollState(slug, el), 350);
    }
  }
}
