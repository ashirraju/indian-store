import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  it('should create navbar instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new NavbarComponent();
      expect(comp).toBeTruthy();
    });
  });
});
