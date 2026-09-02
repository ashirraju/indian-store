import { ChangeDetectionStrategy, Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../../../services/store-state.service';
import { Order, OrderStatus } from '../../../../models/order.model';

@Component({
  selector: 'app-operations-pipeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operations-pipeline.component.html',
  styleUrl: './operations-pipeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsPipelineComponent implements OnInit {
  readonly store = inject(StoreStateService);

  readonly inPackingOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'In Packing')
  );

  readonly packedOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'Packed' || o.status === 'Ready for Dispatch')
  );

  readonly outForDeliveryOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'Out for Delivery')
  );

  readonly deliveredOrders = computed(() =>
    this.store.orders().filter(o => o.status === 'Delivered')
  );

  ngOnInit() {
    this.store.syncOrdersFromBackend();
  }

  markAsPacked(order: Order) {
    this.store.updateOrderStatus(order.id, 'Packed' as OrderStatus);
  }

  markOutForDelivery(order: Order, agentName = 'Vikram Singh (Logistics)') {
    this.store.updateOrderStatus(order.id, 'Out for Delivery' as OrderStatus, agentName);
  }

  markDelivered(order: Order) {
    this.store.updateOrderStatus(order.id, 'Delivered' as OrderStatus);
  }
}
