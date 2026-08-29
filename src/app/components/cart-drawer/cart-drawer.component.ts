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
  checkoutPhone = '+61 412 345 678';
  checkoutEmail = 'aarav.sharma@example.com.au';
  checkoutAddress = '24 George Street, The Rocks';
  checkoutCity = 'Sydney';
  checkoutState = 'NSW';
  checkoutPostcode = '2000';
  checkoutPayment = 'Credit/Debit Card';

  onConfirmOrder(event: Event) {
    event.preventDefault();
    this.store.placeOrder({
      name: this.checkoutName,
      phone: this.checkoutPhone,
      email: this.checkoutEmail,
      address: this.checkoutAddress,
      city: this.checkoutCity,
      state: this.checkoutState,
      pincode: this.checkoutPostcode,
      postcode: this.checkoutPostcode,
      paymentMethod: this.checkoutPayment
    });
    this.showCheckoutForm.set(false);
  }
}
