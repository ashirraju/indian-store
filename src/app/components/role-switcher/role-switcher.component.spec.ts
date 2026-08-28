import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { RoleSwitcherComponent } from './role-switcher.component';

describe('RoleSwitcherComponent', () => {
  it('should create role switcher instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new RoleSwitcherComponent();
      expect(comp).toBeTruthy();
      expect(comp.roles.length).toBeGreaterThan(0);
    });
  });
});
