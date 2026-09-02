import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { StoreStateService } from '../../services/store-state.service';
import { AppKeycloakService } from '../../services/app-keycloak.service';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-view.component.html',
  styleUrl: './admin-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminViewComponent {
  readonly store = inject(StoreStateService);
  readonly keycloak = inject(AppKeycloakService);

  onLogout() {
    this.keycloak.logout();
  }
}
