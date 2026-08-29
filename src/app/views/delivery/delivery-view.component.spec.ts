import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StoreStateService } from '../../services/store-state.service';
import { DeliveryViewComponent } from './delivery-view.component';

describe('DeliveryViewComponent', () => {
  it('should create delivery view instance', () => {
    const injector = createEnvironmentInjector([ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new DeliveryViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});

