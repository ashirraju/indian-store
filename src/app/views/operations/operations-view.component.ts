import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { StoreStateService } from '../../services/store-state.service';
import { AppKeycloakService } from '../../services/app-keycloak.service';

@Component({
  selector: 'app-operations-view',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './operations-view.component.html',
  styleUrl: './operations-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsViewComponent {
  readonly store = inject(StoreStateService);
  readonly keycloak = inject(AppKeycloakService);

  onLogout() {
    this.keycloak.logout();
  }
}
