import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StoreStateService } from '../../services/store-state.service';
import { CategoryPanelComponent } from './category-panel.component';

describe('CategoryPanelComponent', () => {
  it('should create category panel instance', () => {
    const injector = createEnvironmentInjector([ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new CategoryPanelComponent();
      expect(comp).toBeTruthy();
    });
  });
});

