import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../../../services/store-state.service';

@Component({
  selector: 'app-operations-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operations-notifications.component.html',
  styleUrl: './operations-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsNotificationsComponent implements OnInit {
  readonly store = inject(StoreStateService);

  ngOnInit() {
    this.store.syncNotifications('Operations');
    this.store.initNotificationStream('Operations');
  }

  markNotifRead(notif: any) {
    this.store.markNotificationAsRead(notif.id);
  }

  markAllNotifsRead() {
    this.store.markAllNotificationsAsRead();
  }

  jumpToOrder(orderId?: string) {
    if (orderId) {
      this.store.navigateTo('/operations/pipeline');
    }
  }
}