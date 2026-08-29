import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StoreStateService } from '../../services/store-state.service';
import { ManagerViewComponent } from './manager-view.component';

describe('ManagerViewComponent', () => {
  it('should create manager view instance', () => {
    const injector = createEnvironmentInjector([ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new ManagerViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});

