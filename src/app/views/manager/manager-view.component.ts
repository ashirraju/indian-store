import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-manager-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-view.component.html',
  styleUrl: './manager-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerViewComponent {
  readonly store = inject(StoreStateService);

  searchFilter = '';
  isAddModalOpen = signal<boolean>(false);

  newProdName = '';
  newProdCategory = 'Spices & Seasonings';
  newProdPrice = 399;
  newProdWeight = '250g Pack';
  newProdStock = 50;
  newProdOrigin = 'India';
  newProdImage = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80';
  newProdDesc = '';

  readonly totalSalesRevenue = computed(() =>
    this.store.orders().reduce((sum, o) => sum + o.totalAmount, 0)
  );

  readonly lowStockCount = computed(() =>
    this.store.products().filter(p => p.stock < 20).length
  );

  readonly organicProductCount = computed(() =>
    this.store.products().filter(p => p.isOrganic).length
  );

  readonly filteredProducts = computed(() => {
    const query = this.searchFilter.toLowerCase();
    return this.store.products().filter(p =>
      p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );
  });

  adjustStock(prod: Product, delta: number) {
    const newStock = Math.max(0, prod.stock + delta);
    this.store.saveProduct({ id: prod.id, stock: newStock });
  }

  promptEditPrice(prod: Product) {
    const val = prompt(`Enter new price in AUD for "${prod.name}" (Current: $${prod.price}):`, prod.price.toString());
    if (val && !isNaN(Number(val))) {
      this.store.saveProduct({ id: prod.id, price: Number(val) });
    }
  }

  onAddProductSubmit(event: Event) {
    event.preventDefault();
    this.store.saveProduct({
      name: this.newProdName,
      category: this.newProdCategory,
      price: Number(this.newProdPrice),
      weight: this.newProdWeight,
      stock: Number(this.newProdStock),
      originRegion: this.newProdOrigin,
      imageUrl: this.newProdImage,
      description: this.newProdDesc,
      isOrganic: true
    });
    this.isAddModalOpen.set(false);
  }
}
