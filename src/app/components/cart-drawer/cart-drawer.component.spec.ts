import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { CartDrawerComponent } from './cart-drawer.component';

describe('CartDrawerComponent', () => {
  it('should create cart drawer instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new CartDrawerComponent();
      expect(comp).toBeTruthy();
    });
  });
});
