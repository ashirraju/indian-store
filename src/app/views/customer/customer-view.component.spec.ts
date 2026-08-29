import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StoreStateService } from '../../services/store-state.service';
import { CustomerViewComponent } from './customer-view.component';

describe('CustomerViewComponent', () => {
  it('should create customer view instance', () => {
    const injector = createEnvironmentInjector([ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new CustomerViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});

