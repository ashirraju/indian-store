import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { CustomerViewComponent } from './customer-view.component';

describe('CustomerViewComponent', () => {
  it('should create customer view instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new CustomerViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});
