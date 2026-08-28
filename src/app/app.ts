import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from './services/store-state.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { WishlistDrawerComponent } from './components/wishlist-drawer/wishlist-drawer.component';
import { OrdersModalComponent } from './components/orders-modal/orders-modal.component';
import { CategoryPanelComponent } from './components/category-panel/category-panel.component';
import { ToastComponent } from './components/toast/toast.component';

import { CustomerViewComponent } from './views/customer/customer-view.component';
import { ManagerViewComponent } from './views/manager/manager-view.component';
import { OperationsViewComponent } from './views/operations/operations-view.component';
import { DeliveryViewComponent } from './views/delivery/delivery-view.component';
import { AdminViewComponent } from './views/admin/admin-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    CartDrawerComponent,
    WishlistDrawerComponent,
    OrdersModalComponent,
    CategoryPanelComponent,
    ToastComponent,
    CustomerViewComponent,
    ManagerViewComponent,
    OperationsViewComponent,
    DeliveryViewComponent,
    AdminViewComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  readonly store = inject(StoreStateService);
}
