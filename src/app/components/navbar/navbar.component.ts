import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  readonly store = inject(StoreStateService);
  readonly searchQuery = signal<string>('');

  readonly filteredMenus = computed(() => {
    const role = this.store.activeRole();
    const rolePaths = ['/admin', '/manager', '/operations', '/delivery'];
    return this.store
      .menus()
      .filter(m => !rolePaths.includes(m.path) && m.visibleRoles.includes(role))
      .sort((a, b) => a.order - b.order);
  });

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    if (this.store.activePath() !== '/store') {
      this.store.navigateTo('/store');
    }
  }

  onMenuClick(item: { path: string; label: string }) {
    if (item.path.startsWith('/category/')) {
      this.store.openDepartment(item.label);
    } else {
      this.store.navigateTo(item.path);
    }
  }

  slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}
