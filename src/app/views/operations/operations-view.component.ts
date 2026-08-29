import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../services/store-state.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-operations-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operations-view.component.html',
  styleUrl: './operations-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsViewComponent {
  readonly store = inject(StoreStateService);

  onLogout() {
    this.store.keycloak.logout();
  }

  readonly pendingPackingOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'Placed')
  );

  readonly inPackingOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'In Packing')
  );

  readonly readyOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'Ready for Dispatch')
  );

  advanceStatus(order: Order, newStatus: OrderStatus, notes: string, deliveryAgent?: string) {
    this.store.updateOrderStatus(order.id, newStatus, notes, deliveryAgent);
  }

  restockItem(prod: any) {
    this.store.saveProduct({ id: prod.id, stock: prod.stock + 50 });
  }
}
