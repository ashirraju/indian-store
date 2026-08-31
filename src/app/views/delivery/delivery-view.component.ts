import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../services/store-state.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-delivery-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivery-view.component.html',
  styleUrl: './delivery-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryViewComponent {
  readonly store = inject(StoreStateService);

  onLogout() {
    this.store.keycloak.logout();
  }

  readonly activeDeliveryOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'Packed' || o.status === 'Ready for Dispatch' || o.status === 'Out for Delivery' || o.status === 'Delivered')
  );

  updateStatus(order: Order, newStatus: OrderStatus, notes: string) {
    this.store.updateOrderStatus(order.id, newStatus, notes, 'Vikram Singh (Express Logistics)');
  }

  callCustomer(phone: string) {
    alert(`Initiating phone call to customer: ${phone}`);
  }
}
