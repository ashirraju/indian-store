import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { Product } from '../../models/product.model';
import { Order } from '../../models/order.model';
import { CustomPage } from '../../models/cms.model';
import { DynamicFormSchema } from '../../models/dynamic-form.model';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-view.component.html',
  styleUrl: './customer-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerViewComponent {
  readonly Math = Math;
  readonly store = inject(StoreStateService);

  readonly selectedProduct = signal<Product | null>(null);
  readonly selectedOrder = signal<Order | null>(null);
  readonly formDataState = signal<Record<string, any>>({});

  readonly categoryListWithoutAll = computed(() =>
    this.store.categories().filter(c => c !== 'All Categories')
  );

  readonly activeCustomPage = computed<CustomPage | null>(() => {
    const path = this.store.activePath();
    if (path.startsWith('/page/')) {
      const slug = path.replace('/page/', '');
      return this.store.customPages().find(p => p.slug === slug) || null;
    }
    return null;
  });

  readonly activeCustomForm = computed<DynamicFormSchema | null>(() => {
    const path = this.store.activePath();
    if (path.startsWith('/form/')) {
      const slug = path.replace('/form/', '');
      return this.store.customForms().find(f => f.slug === slug) || null;
    }
    return null;
  });

  getProductsByCategory(categoryName: string): Product[] {
    return this.store.products().filter(p => p.category === categoryName);
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

  openDepartmentView(categoryName: string) {
    this.store.activeDepartment.set(categoryName);
    this.activeSubMenu.set('All');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  closeDepartmentView() {
    this.store.activeDepartment.set(null);
    this.activeSubMenu.set('All');
  }

  getSubMenusForCategory(catName: string): string[] {
    return this.departmentSubMenus[catName] || ['All', 'Supersaver', 'Organic'];
  }

  getSubSectionsForDepartment(categoryName: string): string[] {
    const allSubs = this.departmentSubMenus[categoryName] || ['Supersaver', 'Organic'];
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
      filtered = list.filter(p => (p.originalPrice && p.originalPrice > p.price) || p.isBestseller);
    } else if (lower === 'organic') {
      filtered = list.filter(p => p.isOrganic);
    } else if (lower === 'atta & flours') {
      filtered = list.filter(p => /atta|flour|wheat|chakki|sharbati/i.test(p.name + ' ' + (p.tags || []).join(' ')));
    } else if (lower === 'rice') {
      filtered = list.filter(p => /rice|basmati|sona masoori|paddy|idli/i.test(p.name + ' ' + (p.tags || []).join(' ')));
    } else if (lower === 'whole grains') {
      filtered = list.filter(p => /grain|whole|multigrain|wheat|brown/i.test(p.name + ' ' + (p.tags || []).join(' ')));
    } else if (lower === 'poha') {
      filtered = list.filter(p => /poha|flakes|beaten/i.test(p.name + ' ' + (p.tags || []).join(' ')));
    } else if (lower === 'millet & other flours') {
      filtered = list.filter(p => /millet|rava|suji|ragi|oats|bajra|jowar/i.test(p.name + ' ' + (p.tags || []).join(' ')));
    } else {
      filtered = list.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(lower))) ||
        p.description.toLowerCase().includes(lower)
      );
    }

    const sort = this.departmentSortBy();
    return [...filtered].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    });
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

  updateFormData(fieldName: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

    this.formDataState.set({
      ...this.formDataState(),
      [fieldName]: value
    });
  }

  onDynamicFormSubmit(event: Event, formSchema: DynamicFormSchema) {
    event.preventDefault();
    this.store.submitForm(formSchema.id, formSchema.title, this.formDataState());
    this.formDataState.set({});
    this.store.navigateTo('/store');
  }
}
