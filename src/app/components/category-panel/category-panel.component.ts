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
