import { ChangeDetectionStrategy, Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../../../services/store-state.service';
import { ApiService } from '../../../../services/api.service';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-operations-replenishment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operations-replenishment.component.html',
  styleUrl: './operations-replenishment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsReplenishmentComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);

  ngOnInit() {
    this.store.syncCatalogFromBackend();
  }

  readonly lowStockProducts = computed(() =>
    this.store.products().filter(p => p.stock <= (p.lowStockThreshold || 10))
  );

  async reorderStock(prod: Product, qty: number = 50) {
    const newStock = prod.stock + qty;
    try {
      await this.api.updateProductStock(prod.id, { stock: newStock }, 'Operations');
      this.store.showToast('success', 'Stock Replenished', `Added ${qty} units to ${prod.name}`);
      this.store.syncCatalogFromBackend();
    } catch {
      this.store.showToast('error', 'Reorder Failed', 'Could not record replenishment');
    }
  }

  restockItem(prod: Product, qty: number = 50) {
    this.reorderStock(prod, qty);
  }
}