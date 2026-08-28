import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreStateService } from '../../services/store-state.service';
import { AppRole } from '../../models/user.model';

@Component({
  selector: 'app-role-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-switcher.component.html',
  styleUrl: './role-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleSwitcherComponent {
  readonly store = inject(StoreStateService);

  readonly roles: { name: AppRole; icon: string }[] = [
    { name: 'Customer', icon: 'shopping_bag' },
    { name: 'Manager', icon: 'monitoring' },
    { name: 'Operations', icon: 'precision_manufacturing' },
    { name: 'Delivery', icon: 'local_shipping' },
    { name: 'Admin', icon: 'tune' }
  ];

  selectRole(role: AppRole) {
    this.store.setRole(role);
    if (role === 'Customer' && !this.store.activePath().startsWith('/store')) {
      this.store.navigateTo('/store');
    }
  }
}
