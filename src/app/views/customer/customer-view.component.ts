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
