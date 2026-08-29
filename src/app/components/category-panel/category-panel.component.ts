import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../services/store-state.service';

@Component({
  selector: 'app-category-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-panel.component.html',
  styleUrl: './category-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryPanelComponent {
  readonly store = inject(StoreStateService);

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

  getProductsCount(catName: string): number {
    return this.store.products().filter(p => p.category === catName).length;
  }

  slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  selectCategory(catName: string) {
    this.store.isCategoryPanelOpen.set(false);
    if (this.store.activePath() !== '/store') {
      this.store.navigateTo('/store');
    }

    if (catName !== 'All Categories') {
      setTimeout(() => {
        const id = 'cat-section-' + this.slugify(catName);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }
}
