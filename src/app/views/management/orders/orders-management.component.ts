import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../../services/store-state.service';
import { ApiService } from '../../../services/api.service';
import { Order, OrderStatus } from '../../../models/order.model';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-management.component.html',
  styleUrl: './orders-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersManagementComponent implements OnInit {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);

  readonly orderStatusFilter = signal<'ALL' | 'In Packing' | 'Packed' | 'Out for Delivery' | 'Delivered'>('ALL');
  orderSearchQuery = '';

  readonly filteredOrders = computed(() => {
    let list = this.store.orders();
    const filter = this.orderStatusFilter();
    if (filter !== 'ALL') {
      list = list.filter(o => o.status === filter);
    }
    const q = this.orderSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q))
      );
    }
    return list;
  });

  readonly inPackingCount = computed(() => this.store.orders().filter(o => o.status === 'In Packing').length);
  readonly packedCount = computed(() => this.store.orders().filter(o => o.status === 'Packed' || o.status === 'Ready for Dispatch').length);
  readonly outForDeliveryCount = computed(() => this.store.orders().filter(o => o.status === 'Out for Delivery').length);
  readonly deliveredCount = computed(() => this.store.orders().filter(o => o.status === 'Delivered').length);

  ngOnInit() {
    this.store.syncOrdersFromBackend();
  }

  async updateOrderStatus(order: Order, newStatus: OrderStatus) {
    await this.store.updateOrderStatus(order.id, newStatus);
    this.store.showToast('success', 'Order Status Updated', `Order #${order.id} is now ${newStatus}`);
  }

  async markOrderPaid(order: Order) {
    try {
      await this.api.updateOrderPayment(order.id, { paymentStatus: 'PAID' });
      await this.store.syncOrdersFromBackend();
      this.store.showToast('success', 'Payment Verified', `Order #${order.id} marked as PAID`);
    } catch {
      this.store.showToast('error', 'Update Failed', 'Could not update payment status');
    }
  }

  markAsPacked(order: Order) {
    this.updateOrderStatus(order, 'Packed' as OrderStatus);
  }

  markAsOutForDelivery(order: Order) {
    this.updateOrderStatus(order, 'Out for Delivery' as OrderStatus);
  }

  markAsDelivered(order: Order) {
    this.updateOrderStatus(order, 'Delivered' as OrderStatus);
  }
}
