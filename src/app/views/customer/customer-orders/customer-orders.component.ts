import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../../services/store-state.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-orders.component.html',
  styleUrl: './customer-orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerOrdersComponent implements OnInit {
  readonly store = inject(StoreStateService);

  ngOnInit() {
    if (this.store.keycloak.isAuthenticated()) {
      this.store.syncOrdersFromBackend();
    }
  }

  readonly statusFilter = signal<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL');

  readonly activeOrdersCount = computed(() =>
    this.store.orders().filter(o => o.status !== 'Delivered').length
  );

  readonly deliveredOrdersCount = computed(() =>
    this.store.orders().filter(o => o.status === 'Delivered').length
  );

  readonly filteredOrders = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'ACTIVE') {
      return this.store.orders().filter(o => o.status !== 'Delivered');
    }
    if (filter === 'DELIVERED') {
      return this.store.orders().filter(o => o.status === 'Delivered');
    }
    return this.store.orders();
  });

  openLiveTracking(order: Order) {
    this.store.selectedOrderForTracking.set(order);
  }

  reorderItems(order: Order) {
    order.items.forEach(item => {
      this.store.addToCart(item.product, item.quantity);
    });
    this.store.showToast('success', 'Items Added to Cart 🛒', `Readded items from order #${order.id} to your cart.`);
    this.store.isCartOpen.set(true);
  }
}
