import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StoreStateService } from '../../services/store-state.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  it('should create navbar instance', () => {
    const injector = createEnvironmentInjector([ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new NavbarComponent();
      expect(comp).toBeTruthy();
    });
  });
});

