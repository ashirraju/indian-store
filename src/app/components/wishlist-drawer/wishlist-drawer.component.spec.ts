import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StoreStateService } from '../../services/store-state.service';
import { WishlistDrawerComponent } from './wishlist-drawer.component';

describe('WishlistDrawerComponent', () => {
  it('should create wishlist drawer instance', () => {
    const injector = createEnvironmentInjector([ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new WishlistDrawerComponent();
      expect(comp).toBeTruthy();
    });
  });
});

