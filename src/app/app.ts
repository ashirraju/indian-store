import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { StoreStateService } from './services/store-state.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { WishlistDrawerComponent } from './components/wishlist-drawer/wishlist-drawer.component';
import { CategoryPanelComponent } from './components/category-panel/category-panel.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    CartDrawerComponent,
    WishlistDrawerComponent,
    CategoryPanelComponent,
    ToastComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  readonly store = inject(StoreStateService);
}

