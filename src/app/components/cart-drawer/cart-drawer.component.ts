import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartDrawerComponent {
  readonly store = inject(StoreStateService);
  readonly showCheckoutForm = signal<boolean>(false);

  checkoutName = 'Aarav Sharma';
  checkoutPhone = '+91 98765 43210';
  checkoutEmail = 'aarav@example.com';
  checkoutAddress = 'Flat 402, Lotus Heights, MG Road';
  checkoutCity = 'Bengaluru';
  checkoutPincode = '560001';
  checkoutPayment = 'UPI Instant (GPay/PhonePe)';

  onConfirmOrder(event: Event) {
    event.preventDefault();
    this.store.placeOrder({
      name: this.checkoutName,
      phone: this.checkoutPhone,
      email: this.checkoutEmail,
      address: this.checkoutAddress,
      city: this.checkoutCity,
      pincode: this.checkoutPincode,
      paymentMethod: this.checkoutPayment
    });
    this.showCheckoutForm.set(false);
  }
}
