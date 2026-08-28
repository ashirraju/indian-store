import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../services/store-state.service';

@Component({
  selector: 'app-wishlist-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist-drawer.component.html',
  styleUrl: './wishlist-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistDrawerComponent {
  readonly store = inject(StoreStateService);

  moveAllToCart() {
    const items = [...this.store.wishlist()];
    items.forEach(prod => {
      this.store.addToCart(prod, 1);
    });
    this.store.wishlist.set([]);
    this.store.showToast('success', 'Moved All Items to Cart 🛒', 'All wishlisted items have been added to your cart.');
    this.store.isWishlistOpen.set(false);
    this.store.isCartOpen.set(true);
  }
}
