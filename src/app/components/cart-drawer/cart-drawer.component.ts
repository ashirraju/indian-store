import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { AppKeycloakService } from '../../services/app-keycloak.service';
import { AppRole, AppRoutes } from '../../enums';

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
  readonly keycloak = inject(AppKeycloakService);

  readonly showCheckoutForm = signal<boolean>(false);
  readonly showAuthChoice = signal<boolean>(false);
  readonly isGuest = signal<boolean>(false);
  readonly phoneError = signal<string | null>(null);

  checkoutName = 'Aarav Sharma';
  checkoutPhone = '0412 345 678';
  checkoutEmail = 'aarav.sharma@example.com.au';
  checkoutAddress = '24 George Street, The Rocks';
  checkoutCity = 'Sydney';
  checkoutState = 'NSW';
  checkoutPostcode = '2000';
  checkoutPayment = 'Credit/Debit Card';

  /**
   * Check authentication before proceeding to payment/checkout
   */
  startCheckoutFlow() {
    if (this.keycloak.isAuthenticated()) {
      const user = this.keycloak.currentUser();
      if (user) {
        if (user.firstName || user.lastName) {
          this.checkoutName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        if (user.email) {
          this.checkoutEmail = user.email;
        }
      }
      this.isGuest.set(false);
      this.showAuthChoice.set(false);
      this.showCheckoutForm.set(true);
    } else {
      // User is not signed in -> ask option to sign in or continue as guest
      this.showAuthChoice.set(true);
      this.showCheckoutForm.set(false);
    }
  }

  /**
   * User chose to sign in with Keycloak
   */
  signInWithKeycloak() {
    this.keycloak.loginWithKeycloak(AppRoutes.STORE, AppRole.CUSTOMER);
  }

  /**
   * User chose to proceed as Guest
   */
  continueAsGuest() {
    this.isGuest.set(true);
    this.showAuthChoice.set(false);
    this.showCheckoutForm.set(true);
    this.checkoutName = '';
    this.checkoutPhone = '';
    this.checkoutEmail = '';
    this.checkoutAddress = '';
  }

  /**
   * Back to Cart Items
   */
  backToCart() {
    this.showAuthChoice.set(false);
    this.showCheckoutForm.set(false);
    this.phoneError.set(null);
  }

  /**
   * Validate Australian phone number format
   */
  validatePhone(): boolean {
    const raw = this.checkoutPhone.trim().replace(/[\s\-()]/g, '');
    if (!raw) {
      this.phoneError.set('Mobile number is required for delivery coordination in Australia.');
      return false;
    }

    // Australian Mobile format check: 04XXXXXXXX, +614XXXXXXXX, or 10 digits
    const auMobileRegex = /^(\+?61|0)4\d{8}$/;
    const generalAuPhoneRegex = /^(\+?61|0)[2-8]\d{8}$/;

    if (!auMobileRegex.test(raw) && !generalAuPhoneRegex.test(raw)) {
      this.phoneError.set('Please enter a valid Australian mobile number (e.g., 0412 345 678 or +61 412 345 678).');
      return false;
    }

    this.phoneError.set(null);
    return true;
  }

  onConfirmOrder(event: Event) {
    event.preventDefault();

    if (!this.validatePhone()) {
      return;
    }

    this.store.placeOrder({
      name: this.checkoutName || (this.isGuest() ? 'Guest Customer' : 'Valued Customer'),
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
    this.showAuthChoice.set(false);
    this.phoneError.set(null);
  }
}
