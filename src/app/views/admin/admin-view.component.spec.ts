import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { AdminViewComponent } from './admin-view.component';

describe('AdminViewComponent', () => {
  it('should create admin view instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new AdminViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});
