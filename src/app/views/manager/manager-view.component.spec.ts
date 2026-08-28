import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { ManagerViewComponent } from './manager-view.component';

describe('ManagerViewComponent', () => {
  it('should create manager view instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new ManagerViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});
