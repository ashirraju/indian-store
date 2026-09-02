import { ChangeDetectionStrategy, Component, inject, signal, computed, ElementRef, HostListener, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreStateService } from '../../services/store-state.service';
import { ApiService } from '../../services/api.service';
import { AppKeycloakService } from '../../services/app-keycloak.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  readonly store = inject(StoreStateService);
  readonly api = inject(ApiService);
  readonly keycloak = inject(AppKeycloakService);
  private readonly elementRef = inject(ElementRef);

  readonly searchInput = signal<string>('');
  readonly suggestions = signal<any[]>([]);
  readonly suggestedCategories = signal<any[]>([]);
  readonly isSuggestionsOpen = signal<boolean>(false);
  readonly isMoreMenuOpen = signal<boolean>(false);
  readonly visibleMenuCount = signal<number>(30);

  @ViewChild('dynamicNav') dynamicNavRef?: ElementRef<HTMLElement>;
  private resizeObserver?: ResizeObserver;

  readonly visibleMenus = computed(() => {
    const menus = this.filteredMenus();
    const count = this.visibleMenuCount();
    if (menus.length <= count) return menus;
    return menus.slice(0, count);
  });

  readonly overflowMenus = computed(() => {
    const menus = this.filteredMenus();
    const count = this.visibleMenuCount();
    if (menus.length <= count) return [];
    return menus.slice(count);
  });
  readonly isLoadingSuggestions = signal<boolean>(false);

  private debounceTimer: any = null;

  readonly filteredMenus = computed(() => {
    const role = this.store.activeRole();
    const rolePaths = ['/admin', '/manager', '/operations', '/delivery'];
    return this.store
      .menus()
      .filter(m => !rolePaths.includes(m.path) && m.visibleRoles.includes(role))
      .sort((a, b) => a.order - b.order);
  });

  onSearchInput(query: string) {
    this.searchInput.set(query);
    clearTimeout(this.debounceTimer);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      this.suggestions.set([]);
      this.suggestedCategories.set([]);
      this.isSuggestionsOpen.set(false);
      this.isLoadingSuggestions.set(false);
      return;
    }

    this.isSuggestionsOpen.set(true);
    this.isLoadingSuggestions.set(true);

    this.debounceTimer = setTimeout(async () => {
      try {
        const res = await this.api.getSearchSuggestions(trimmed);
        if (res.success) {
          this.suggestions.set(res.suggestions || []);
          this.suggestedCategories.set(res.categories || []);
        } else {
          this.suggestions.set([]);
          this.suggestedCategories.set([]);
        }
      } catch (err) {
        console.error('Suggestions error:', err);
        this.suggestions.set([]);
        this.suggestedCategories.set([]);
      } finally {
        this.isLoadingSuggestions.set(false);
      }
    }, 200);
  }

  submitSearch() {
    clearTimeout(this.debounceTimer);
    this.isSuggestionsOpen.set(false);
    const query = this.searchInput().trim();
    if (query) {
      this.store.executeSearch(query);
      if (this.store.activePath() !== '/store') {
        this.store.navigateTo('/store');
      }
    }
  }

  selectProductSuggestion(sug: any) {
    this.searchInput.set(sug.name);
    this.isSuggestionsOpen.set(false);
    this.store.executeSearch(sug.name);
    if (this.store.activePath() !== '/store') {
      this.store.navigateTo('/store');
    }
  }

  selectCategorySuggestion(cat: any) {
    this.isSuggestionsOpen.set(false);
    this.store.openDepartment(cat.name);
    if (this.store.activePath() !== '/store') {
      this.store.navigateTo('/store');
    }
  }

  clearSearch() {
    this.searchInput.set('');
    this.suggestions.set([]);
    this.suggestedCategories.set([]);
    this.isSuggestionsOpen.set(false);
    this.store.clearSearch();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isSuggestionsOpen.set(false);
      this.isMoreMenuOpen.set(false);
    }
  }

  ngAfterViewInit() {
    if (typeof ResizeObserver !== 'undefined' && this.dynamicNavRef) {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculateDynamicSplit();
      });
      this.resizeObserver.observe(this.dynamicNavRef.nativeElement);
    }
    setTimeout(() => this.calculateDynamicSplit(), 50);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  calculateDynamicSplit() {
    const el = this.dynamicNavRef?.nativeElement;
    const menus = this.filteredMenus();
    if (!el || !menus.length) return;

    const containerWidth = el.clientWidth;
    if (containerWidth <= 0) return;

    // Check actual rendered buttons if available
    const buttons = Array.from(el.querySelectorAll<HTMLElement>('.nav-link:not(.more-nav-btn)'));
    let itemWidths: number[] = [];

    if (buttons.length > 0) {
      itemWidths = buttons.map(b => b.getBoundingClientRect().width + 6);
    } else {
      itemWidths = menus.map(item => Math.ceil((item.label?.length || 6) * 7.2 + 48 + (item.badge ? 28 : 0)));
    }

    // Check if ALL menus fit without the More button
    const totalWidthAll = itemWidths.reduce((a, b) => a + b, 0);
    if (totalWidthAll <= containerWidth) {
      this.visibleMenuCount.set(menus.length);
      return;
    }

    // Pack as many as can fit, leaving room for the More button (~85px)
    const availableWidth = containerWidth - 85;
    let accumulated = 0;
    let count = 0;

    for (const w of itemWidths) {
      if (accumulated + w <= availableWidth) {
        accumulated += w;
        count++;
      } else {
        break;
      }
    }

    this.visibleMenuCount.set(Math.max(1, count));
  }

  toggleMoreMenu(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isMoreMenuOpen.update(v => !v);
  }

  onMoreMouseEnter() {
    this.isMoreMenuOpen.set(true);
  }

  onMoreMouseLeave() {
    this.isMoreMenuOpen.set(false);
  }

  onOverflowMenuClick(item: { path: string; label: string }) {
    this.isMoreMenuOpen.set(false);
    this.onMenuClick(item);
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

  onLogout() {
    this.keycloak.logout();
    this.store.activeRole.set('Customer');
    this.store.navigateTo('/store');
    this.store.showToast('info', 'Logged Out', 'You have been signed out.');
  }

  onCustomerSignIn() {
    this.keycloak.loginWithKeycloak('/store', 'Customer');
  }

  onStaffLogin() {
    this.keycloak.loginWithKeycloak('/admin', 'Admin');
  }
}
